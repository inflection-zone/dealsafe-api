const helper = require('../common/helper');
var request = require("supertest");
const Notification = require('../database/models/Notification').Model;
request = request('http://localhost:' + process.env.PORT);

beforeAll(async (done) => {
    await helper.sleep(500);
    done();
});

afterAll(async (done) => {
    await helper.sleep(10);
    done();
});

describe('Notification tests', () => {

    it('Notification create test', async (done) => {
        var response = await request.post('/api/v1/notification')
            .set('Authorization', `Bearer ${USER_JWT}`)
            .set('Content-Type', 'application/json');
        expect(response.status).toBe(201);
        expect(response.body.status).toEqual('success');
        done();
    });

})