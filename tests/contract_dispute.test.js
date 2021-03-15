const helper = require('../common/helper');
var request = require("supertest");
const ContractDispute = require('../database/models/ContractDispute').Model;
request = request('http://localhost:' + process.env.PORT);

beforeAll(async (done) => {
    await helper.sleep(500);
    done();
});

afterAll(async (done) => {
    await helper.sleep(10);
    done();
});

describe('ContractDispute tests', () => {

    it('ContractDispute create test', async (done) => {
        var response = await request.post('/api/v1/contract-dispute')
            .set('Authorization', `Bearer ${USER_JWT}`)
            .set('Content-Type', 'application/json');
        expect(response.status).toBe(201);
        expect(response.body.status).toEqual('success');
        done();
    });

})