const genpass = require('generate-password');
const logger = require('./logger');
const { ApiError } = require('./api_error');

//////////////////////////////////////////////////////////////////////////////////////

const NEARNESS_SEARCH_DISTANCE = 15.0; //In kilometers

//////////////////////////////////////////////////////////////////////////////////////

// function create_unique_user_display_id(prefix) {
//     var id = uuidv4();
//     id = id.replace(/[^\d]/g, '');
//     id = id.replace('-', '');
//     id = id.substr(0, 10);
//     const identifier = prefix + '-' + id;
//     return identifier;
// }

module.exports.generate_display_id = (prefix = null) => {
    var timestamp = new Date().getTime().toString();
    var display_id = timestamp.substr(4);
    var identifier = display_id;
    if (prefix != null) {
        identifier = prefix + '#' + identifier;
    }
    return identifier;
}

function has_digit(temp_str) {
    return /\d/.test(temp_str);
}

module.exports.get_file_extension = (filename) => {
    var ext = /^.+\.([^.]+)$/.exec(filename);
    return ext == null ? "" : ext[1];
}

module.exports.generate_password = () => {
    var password = "x";
    while (!has_digit(password)) {
        password = genpass.generate({
            length: 12,
            numbers: true,
            lowercase: true,
            uppercase: true,
            symbols: false
        });
    }
    return password;
}

module.exports.get_distance = (lon1, lat1, lon2, lat2) => {

    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const delta_phi = (lat2 - lat1) * Math.PI / 180;
    const delta_lambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(delta_phi / 2) * Math.sin(delta_phi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(delta_lambda / 2) * Math.sin(delta_lambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // in metres

    return d / 1000.0; //in kilometers
}

module.exports.search_by_name = (entities, nameSearch) => {
    var filtered = [];
    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];
        if (e.hasOwnProperty('name')) {
            var temp_str = e.name.toLowerCase();
            var search = nameSearch.toLowerCase();
            if (temp_str.includes(search)) {
                filtered.push(e);
            }
        }
    }
    return filtered;
}

module.exports.exact_match_by_name = (entities, nameSearch) => {
    var filtered = [];
    for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        if (entity.hasOwnProperty('name')) {
            var temp_str = entity.name.toLowerCase();
            var search = nameSearch.toLowerCase();
            if (temp_str.localeCompare(search) == 0) {
                filtered.push(entity);
            }
        }
    }
    return filtered;
}

module.exports.find_by_name = (persons, name) => {
    var found = [];
    for (var i = 0; i < persons.length; i++) {
        var person = persons[i];
        var nameTemp = name.toLowerCase();
        var firstNameLower = person.FirstName.toLowerCase();
        var lastNameLower = person.LastName.toLowerCase();
        if (firstNameLower.includes(nameTemp) ||
            lastNameLower.includes(nameTemp) ||
            nameTemp.includes(firstNameLower) ||
            nameTemp.includes(lastNameLower) ||
            nameTemp == firstNameLower + ' ' + lastNameLower) {
            found.push(person);
        }
        else if (person.hasOwnProperty('EstablishmentName')) {
            var establishmentNameLower = person.EstablishmentName.toLowerCase();
            if (establishmentNameLower.includes(nameTemp) ||
                nameTemp.includes(establishmentNameLower)) {
                found.push(person);
            }
        }
    }
    return found;
}

module.exports.find_by_gender = (persons, gender) => {
    var found = [];
    try {
        for (var i = 0; i < persons.length; i++) {
            var person = persons[i];
            var gx = gender.toLowerCase();
            if (gx == 'm' || gx == 'male') {
                gx = 'm';
            }
            else if (gx == 'f' || gx == 'female') {
                gx = 'f';
            }
            if (person.Gender == null) {
                continue;
            }
            var g = person.Gender.toLowerCase();
            if (g == gx) {
                found.push(person);
            }
        }
    }
    catch (error) {
        logger.Log("Error in comparing gender.");
    }
    return found;
}

module.exports.find_by_phone_number = (persons, phone) => {
    var found = [];
    for (var i = 0; i < persons.length; i++) {

        var person = persons[i];
        var phoneTemp = phone.toLowerCase();
        var phoneLower = person.PhoneNumber.toLowerCase();

        if (phoneLower.includes(phoneTemp) ||
            phoneTemp.includes(phoneLower) ||
            phoneTemp == phoneLower) {
            found.push(person);
        }
    }
    return found;
}

module.exports.find_by_email = (persons, email) => {
    var found = [];
    for (var i = 0; i < persons.length; i++) {

        var person = persons[i];
        var emailTemp = email.toLowerCase();
        var emailLower = person.Email.toLowerCase();

        if (emailLower.includes(emailTemp) ||
            emailTemp.includes(emailLower) ||
            emailTemp == emailLower) {
            found.push(person);
        }
    }
    return found;
}

module.exports.get_prefix_by_gender = (gender) => {

    var gx = gender.toLowerCase();
    if (gx == 'm' || gx == 'male') {
        return 'Mr.';
    }
    else if (gx == 'f' || gx == 'female') {
        return 'Mrs.';
    }
}

module.exports.find_by_locality = (persons, locality) => {
    var found = [];
    try {
        for (var i = 0; i < persons.length; i++) {

            var person = persons[i];
            var searchString = locality.toLowerCase();
            if (person.Locality == null) {
                continue;
            }
            var strLocality = person.Locality.toLowerCase();

            if (strLocality.includes(searchString) ||
                searchString.includes(strLocality) ||
                searchString == strLocality) {
                found.push(person);
            }
        }
    }
    catch (error) {
        logger.Log("Error in comparing gender.");
    }
    return found;
}

module.exports.find_near = (persons, longitude, lattitude) => {
    var found = [];
    for (var i = 0; i < persons.length; i++) {
        var person = persons[i];
        if (person.LocationCoords_Longitude == null || person.LocationCoords_Lattitude == null) {
            continue;
        }
        var dist = this.get_distance(person.LocationCoords_Longitude, person.LocationCoords_Lattitude, longitude, lattitude);
        if (dist < NEARNESS_SEARCH_DISTANCE) {
            person = Object.assign(person, { Distance: dist });
            found.push(person);
        }
    }
    return found;
}

module.exports.get_age_in_days = (birthdate) => {
    var d2 = new Date();
    var d1 = new Date(birthdate);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

module.exports.find_by_age = (persons, minAge, maxAge) => {
    var found = [];
    for (var i = 0; i < persons.length; i++) {
        var person = persons[i];
        if (person.BirthDate == null) {
            continue;
        }
        var ageDays = this.get_age_in_days(person.BirthDate);
        var minAgeDays = 365 * minAge;
        var maxAgeDays = 365 * maxAge;
        if (ageDays <= maxAgeDays && ageDays >= minAgeDays) {
            found.push(person);
        }
    }
    return found;
}

module.exports.sleep = (miliseconds) => {
    return new Promise((resolve) => {
        setTimeout(resolve, miliseconds);
    });
}

module.exports.is_empty = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

exports.handle_validation_error = (result) => {
    var index = 1;
    var error_messages = "";
    for (var er of result.errors) {
        error_messages += ` ${index}. ${er.msg} - <${er.value}> for <${er.param}> in ${er.location}`;
        index++;
    }
    throw new ApiError('Validation errors: ' + error_messages, null, 422);
}

module.exports.sanitize_phonenumber = (phone) => {
    if (!phone) {
        return null;
    }
    var temp = phone;
    temp = temp.replace(' ', '');
    temp = temp.replace('-', '');
    temp = temp.trim();
    return temp;
}