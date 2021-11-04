const expect  = require('chai').expect;
const request = require('supertest');

const server = require('../server')
const app = request.agent(server)

describe("Adding new post", function() {
    it("Success should return true", function() {
        app.post("/user/login").send({
            email: "email@gmail.com",
            password: "123456"
        })
    })
    .end((err, res) => {
        expect(res.body.msg).to.equal(true);
    });
});
