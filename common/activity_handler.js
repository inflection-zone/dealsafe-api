
////////////////////////////////////////////////////////////////////////////////

module.exports.record_activity = (request_object, resonse_object, error = null) => {

    (async() => {
        try{
            var obj = {
                request: request_object,
                response: resonse_object,
                error: error ? error : null
            };
            //Add to activity database
            resolve(true);
        }
        catch(error){
            //reject(error);
        }
    })();
}

// module.exports.get_activities = async (filter) => {
//     await get_activity_records();
// }
