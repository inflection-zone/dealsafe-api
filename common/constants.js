module.exports.Roles = {
        Admin: "Admin",
        Buyer: "Buyer",
        Seller: "Seller",
        BasicUser: "Basic User",
};

module.exports.BankAccountTypes = {
        Current: {
                name: "Current",
                code: 1
        },
        Savings: {
                name: "Savings",
                code: 2
        },
};

module.exports.ContractType = {
        FullPayment: {
                name: "Full Payment",
                code: 1
        },
        PartPayment: {
                name: "Part Payment",
                code: 2
        },
};
