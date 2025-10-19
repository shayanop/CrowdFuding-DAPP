// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

interface IKYCRegistryMuhammadShayanAhmed {
    function isVerified(address user) external view returns (bool);
}

/**
 * Crowdfunding_MuhammadShayanAhmed
 * - Only verified users (or admin via KYC contract) can create campaigns
 * - Anyone can contribute to active campaigns
 * - Auto mark as completed when goal reached
 * - Creator can withdraw when completed; then status becomes Withdrawn
 */
contract Crowdfunding_MuhammadShayanAhmed {
    enum Status { Active, Completed, Withdrawn }

    struct Campaign {
        string title;
        string description;
        address payable creator;
        uint256 goal;         // wei
        uint256 raised;       // wei
        Status status;
    }

    IKYCRegistryMuhammadShayanAhmed public immutable kyc;
    address public immutable admin; // admin of KYCRegistry considered verified too

    Campaign[] private campaigns;

    event CampaignCreated(uint256 indexed id, address indexed creator, string title, uint256 goal);
    event Contributed(uint256 indexed id, address indexed from, uint256 amount, uint256 totalRaised);
    event Withdrawn(uint256 indexed id, address indexed to, uint256 amount);

    constructor(IKYCRegistryMuhammadShayanAhmed _kyc) {
        kyc = _kyc;
        admin = msg.sender;
    }

    function createCampaign(string calldata title, string calldata description, uint256 goalWei) external {
        require(bytes(title).length > 0, "Title required");
        require(goalWei > 0, "Goal must be > 0");
        require(kyc.isVerified(msg.sender), "Not KYC verified");

        Campaign memory c = Campaign({
            title: title,
            description: description,
            creator: payable(msg.sender),
            goal: goalWei,
            raised: 0,
            status: Status.Active
        });
        campaigns.push(c);
        emit CampaignCreated(campaigns.length - 1, msg.sender, title, goalWei);
    }

    function contribute(uint256 id) external payable {
        require(id < campaigns.length, "Invalid id");
        Campaign storage c = campaigns[id];
        require(c.status == Status.Active, "Not active");
        require(msg.value > 0, "No ETH");

        c.raised += msg.value;
        emit Contributed(id, msg.sender, msg.value, c.raised);

        if (c.raised >= c.goal) {
            c.status = Status.Completed;
        }
    }

    function withdraw(uint256 id) external {
        require(id < campaigns.length, "Invalid id");
        Campaign storage c = campaigns[id];
        require(c.status == Status.Completed, "Not completed");
        require(msg.sender == c.creator, "Only creator");

        uint256 amount = c.raised;
        c.raised = 0;
        c.status = Status.Withdrawn;
        (bool ok, ) = c.creator.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(id, c.creator, amount);
    }

    function getCampaign(uint256 id) external view returns (Campaign memory) {
        require(id < campaigns.length, "Invalid id");
        return campaigns[id];
    }

    function getCampaignCount() external view returns (uint256) {
        return campaigns.length;
    }
}


