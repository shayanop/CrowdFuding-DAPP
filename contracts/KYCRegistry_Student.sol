// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * KYCRegistry_MuhammadShayanAhmed
 * - Tracks KYC requests (name, CNIC) per wallet
 * - Admin (deployer) can approve/reject
 * - Other contracts can query verification status
 */
contract KYCRegistry_MuhammadShayanAhmed {
    enum KycStatus { None, Pending, Approved, Rejected }

    struct KycRequest {
        string fullName;      // Student requires approval of full name per assignment
        string cnic;          // National ID / CNIC string
        KycStatus status;     // Current status
    }

    address public immutable admin;

    mapping(address => KycRequest) private addressToRequest;
    mapping(address => bool) private isVerifiedAddress;
    
    // Track pending addresses for admin panel
    address[] private pendingAddresses;
    mapping(address => bool) private isPendingAddress;

    event KycSubmitted(address indexed user, string fullName, string cnic);
    event KycApproved(address indexed user, string fullName);
    event KycRejected(address indexed user, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function submitKyc(string calldata fullName, string calldata cnic) external {
        KycRequest storage req = addressToRequest[msg.sender];
        require(bytes(fullName).length > 0, "Full name required");
        require(bytes(cnic).length > 0, "CNIC required");
        require(req.status != KycStatus.Pending, "Already pending");

        addressToRequest[msg.sender] = KycRequest({
            fullName: fullName,
            cnic: cnic,
            status: KycStatus.Pending
        });

        // Add to pending list if not already there
        if (!isPendingAddress[msg.sender]) {
            pendingAddresses.push(msg.sender);
            isPendingAddress[msg.sender] = true;
        }

        emit KycSubmitted(msg.sender, fullName, cnic);
    }

    function approve(address user) external onlyAdmin {
        KycRequest storage req = addressToRequest[user];
        require(req.status == KycStatus.Pending, "Not pending");

        req.status = KycStatus.Approved;
        isVerifiedAddress[user] = true;
        
        // Remove from pending list
        _removePending(user);
        
        emit KycApproved(user, req.fullName);
    }

    function reject(address user, string calldata reason) external onlyAdmin {
        KycRequest storage req = addressToRequest[user];
        require(req.status == KycStatus.Pending || req.status == KycStatus.Approved, "No request");

        req.status = KycStatus.Rejected;
        isVerifiedAddress[user] = false;
        
        // Remove from pending list
        _removePending(user);
        
        emit KycRejected(user, reason);
    }

    function getKyc(address user) external view returns (KycRequest memory) {
        return addressToRequest[user];
    }

    function isVerified(address user) external view returns (bool) {
        return isVerifiedAddress[user] || user == admin;
    }

    function getAllPending() external view returns (address[] memory) {
        return pendingAddresses;
    }

    function _removePending(address user) private {
        if (isPendingAddress[user]) {
            isPendingAddress[user] = false;
            
            // Find and remove from array
            for (uint i = 0; i < pendingAddresses.length; i++) {
                if (pendingAddresses[i] == user) {
                    pendingAddresses[i] = pendingAddresses[pendingAddresses.length - 1];
                    pendingAddresses.pop();
                    break;
                }
            }
        }
    }
}


