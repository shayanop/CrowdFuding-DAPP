// ABIs matching the actual deployed contracts
export const KYC_ABI = [
  { "type": "function", "name": "admin", "stateMutability": "view", "inputs": [], "outputs": [ {"type":"address"} ] },
  { "type": "function", "name": "submitKyc", "stateMutability": "nonpayable", "inputs": [ {"name":"fullName","type":"string"},{"name":"cnic","type":"string"} ], "outputs": [] },
  { "type": "function", "name": "approve", "stateMutability": "nonpayable", "inputs": [ {"name":"user","type":"address"} ], "outputs": [] },
  { "type": "function", "name": "reject", "stateMutability": "nonpayable", "inputs": [ {"name":"user","type":"address"},{"name":"reason","type":"string"} ], "outputs": [] },
  { "type": "function", "name": "isVerified", "stateMutability": "view", "inputs": [ {"name":"user","type":"address"} ], "outputs": [ {"type":"bool"} ] },
  { "type": "function", "name": "getKyc", "stateMutability": "view", "inputs": [ {"name":"user","type":"address"} ], "outputs": [ {"type":"tuple","components":[{"name":"fullName","type":"string"},{"name":"cnic","type":"string"},{"name":"status","type":"uint8"}]} ] },
  { "type": "function", "name": "getAllPending", "stateMutability": "view", "inputs": [], "outputs": [ {"type":"address[]"} ] },
  { "type": "event", "name": "KycSubmitted", "inputs": [ {"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"fullName","type":"string"},{"indexed":false,"name":"cnic","type":"string"} ], "anonymous": false },
  { "type": "event", "name": "KycApproved", "inputs": [ {"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"fullName","type":"string"} ], "anonymous": false },
  { "type": "event", "name": "KycRejected", "inputs": [ {"indexed":true,"name":"user","type":"address"},{"indexed":false,"name":"reason","type":"string"} ], "anonymous": false }
] as const;

export const CROWDFUND_ABI = [
  { "type":"function","name":"createCampaign","stateMutability":"nonpayable","inputs":[{"name":"title","type":"string"},{"name":"description","type":"string"},{"name":"goalWei","type":"uint256"}],"outputs":[] },
  { "type":"function","name":"contribute","stateMutability":"payable","inputs":[{"name":"id","type":"uint256"}],"outputs":[] },
  { "type":"function","name":"withdraw","stateMutability":"nonpayable","inputs":[{"name":"id","type":"uint256"}],"outputs":[] },
  { "type":"function","name":"getCampaign","stateMutability":"view","inputs":[{"name":"id","type":"uint256"}],"outputs":[{"type":"tuple","components":[{"name":"title","type":"string"},{"name":"description","type":"string"},{"name":"creator","type":"address"},{"name":"goal","type":"uint256"},{"name":"raised","type":"uint256"},{"name":"status","type":"uint8"}]}] },
  { "type":"function","name":"getCampaignCount","stateMutability":"view","inputs":[],"outputs":[{"type":"uint256"}] },
  { "type":"event","name":"CampaignCreated","inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"creator","type":"address"},{"indexed":false,"name":"title","type":"string"},{"indexed":false,"name":"goal","type":"uint256"}],"anonymous":false },
  { "type":"event","name":"Contributed","inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"from","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"totalRaised","type":"uint256"}],"anonymous":false },
  { "type":"event","name":"Withdrawn","inputs":[{"indexed":true,"name":"id","type":"uint256"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"anonymous":false }
] as const;


