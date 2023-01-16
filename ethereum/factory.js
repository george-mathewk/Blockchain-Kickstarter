import web3 from "./web3";
import CampaignFactory from './build/CampaignFactory.json';

const instance = new web3.eth.Contract(
    JSON.parse(CampaignFactory.interface),
    '0x371ce19a21F2ac97A8282D81d7Cd17c29DcC88D1'
    );

    export default instance;
