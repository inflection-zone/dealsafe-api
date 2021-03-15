const helper = require('../common/helper');
var request = require("supertest");
const ContractMilestone = require('../database/models/ContractMilestone').Model;
request = request('http://localhost:' + process.env.PORT);

beforeAll(async (done) => {
    await helper.sleep(500);
    done();
});

afterAll(async (done) => {
    await helper.sleep(10);
    done();
});

describe('ContractMilestone tests', () => {

    it('ContractMilestone create test', async (done) => {
        var response = await request.post('/api/v1/contract-milestone')
            .set('Authorization', `Bearer ${USER_JWT}`)
            .set('Content-Type', 'application/json');
        expect(response.status).toBe(201);
        expect(response.body.status).toEqual('success');
        done();
    });

})