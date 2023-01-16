const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign =  require('../ethereum/build/Campaign.json');

let accounts;
let factory;
let campaign;
let campaignAddress;

beforeEach(async () =>{
    accounts  = await web3.eth.getAccounts();
    
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({data: compiledFactory.bytecode})
    .send({from: accounts[0], gas: '1000000'});

    await factory.methods.createCampaign('100').send({from: accounts[0], gas:'1000000'});

    const addresses = await factory.methods.getCampaign().call();
    campaignAddress = addresses[0];

    campaign = await new web3.eth.Contract(JSON.parse(compiledCampaign.interface), campaignAddress);
});

describe('KickStarter:', () =>{
    it(' see if factory and campaign', ()=>{
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it('check if manager creates campaign', async() =>{
        const manager =  await campaign.methods.manager().call();
        assert.equal(manager, accounts[0]);
    });

    it('check if you can contribute and becomes contributer', async ()=>{
       await campaign.methods.contributers().send({
            value: '200',
            from:accounts[1]
        });



        const isContributer = await campaign.methods.approver(accounts[1]).call();
        assert(isContributer);
    });

    it('to check if the minimumContribution Works', async () =>{
        try{
            await campaign.methods.contributers().send({
                value: '50',
                from:accounts[1]
            });
            assert(false)
        }catch(err){
            assert.ok(err);
        }
    });
    it('ability for manager to create a request', async() =>{
        await campaign.methods.createRequest('Buy battery', '100', accounts[1]).send({
            from: accounts[0],
            gas: '1000000'
        });
        const request = await campaign.methods.requests(0).call();
        assert.equal('Buy battery', request.description);
    });

    it('the full campign process', async ()=>{
        await campaign.methods.contributers().send({
            value: web3.utils.toWei('10','ether'),
            from:accounts[0]
        });

        let initialBalance = await web3.eth.getBalance(accounts[1]);


        await campaign.methods.createRequest('Buy battery', web3.utils.toWei('5', 'ether'), accounts[1]).send({
            from: accounts[0],
            gas: '1000000'
        });

        await campaign.methods.approveRequest(0).send({
            from: accounts[0],
            gas: '1000000'
        });
        await campaign.methods.finalizeRequest(0).send({
            from: accounts[0],
            gas: '1000000'
        });

        let finalBalance = await web3.eth.getBalance(accounts[1]);
       

        assert((finalBalance-initialBalance) > web3.utils.toWei('4.8', 'ether'));
    });
});
