const request =  require('supertest');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('loading express', function () {

    beforeEach(function () {
        server = require('../bin/https');

    });
    afterEach(function () {
        server.close();
    });
    it('responds to /', function testSlash(done) {
        request(server)
            .get('/').trustLocalhost()
            .expect(200, done);
    });
});
