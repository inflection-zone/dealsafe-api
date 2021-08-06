module.exports.Roles = {
    Admin: "Admin",
    Buyer: "Buyer",
    Seller: "Seller",
    BasicUser: "Basic User",
};

module.exports.ContractRoles = {
    Buyer: {
        name: "Buyer",
        type_id: 1
    },
    Seller: {
        name: "Seller",
        type_id: 2
    }
};

module.exports.BankAccountTypes = {
    Current: {
        name: "Current",
        type_id: 1
    },
    Savings: {
        name: "Savings",
        type_id: 2
    },
};

module.exports.ContractPaymentModes = {
    FullPayment: {
        name: "Full Payment",
        type_id: 1
    },
    PartPayment: {
        name: "Part Payment",
        type_id: 2
    },
};

module.exports.ContractStatusTypes = {
    Created: {
        name: "Created",
        type_id: 1
    },
    InProgress: {
        name: "In-Progress",
        type_id: 2
    },
    Closed: {
        name: "Completed",
        type_id: 3
    },
    Cancelled: {
        name: "Cancelled",
        type_id: 4
    }
};

module.exports.TransactionTypes = {
    BuyerToEscrow_Deposit: {
        name: "Buyer to Escrow (Deposit)",
        type_id: 1
    },
    BuyerToEscrow_Brokerage: {
        name: "Buyer to Escrow (Brokerage)",
        type_id: 2
    },
    EscrowToBuyer_Refund: {
        name: "Escrow to Buyer (Refund)",
        type_id: 3
    },
    EscrowToSeller_Release: {
        name: "Escrow to Seller (Release)",
        type_id: 4
    },
    SellerToEscrow_Brokerage: {
        name: "Seller to Escrow (Brokerage)",
        type_id: 5
    },
    SellerToEscrow_Revert: {
        name: "Seller to Escrow (Revert)",
        type_id: 6
    }
};

module.exports.TransactionStatusTypes = {
    Created: {
        name: "Created",
        type_id: 1
    },
    Queued: {
        name: "Queued",
        type_id: 2
    },
    PendingApproval: {
        name: "Pending approval",
        type_id: 3
    },
    Approved: {
        name: "Approved",
        type_id: 4
    },
    Successful: {
        name: "Successful",
        type_id: 5
    },
    Rejected: {
        name: "Rejected",
        type_id: 6
    }
};

module.exports.AmountPercentage={
    Tax_Percentage: 0.05, //5% percent tax amount
    Buyer_Brokerage_Percentage: 0.02, //2% percent buyer brokerage
    Seller_Brokerage_Percentage: 0.02, //2% percent seller brokerage
}