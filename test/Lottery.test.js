const assert = require("assert");
const { captureRejections } = require("events");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: 1000000 });
});

describe("Lottery Contract", () => {
  it("Was Deployed", () => {
    assert.ok(lottery.options.address);
  });
  it("Allows one account to enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });
    assert.equal(players.length, 1);
    assert.equal(players[0], accounts[0]);
  });

  it("Allows multiple account to enter", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether"),
    });
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.02", "ether"),
    });
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.02", "ether"),
    });
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0],
    });
    assert.equal(players.length, 3);
    assert.equal(players[0], accounts[0]);
    assert.equal(players[1], accounts[1]);
    assert.equal(players[2], accounts[2]);
  });
  it("Requires a minimum amount of ether to enter", async () => {
    let executed;
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: "100",
      });
      executed = trye;
    } catch (err) {
      executed = false;
    }

    assert.equal(false, executed);
  });
  it("Allows only manager to pick the winner", async () => {
    let executed;
    try {
      await lottery.methods.enter().send({
        from: accounts[1],
        value: web3.utils.toWei("0.02", "ether"),
      });

      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });

      executed = true;
    } catch (err) {
      executed = false;
    }

    assert.equal(false, executed);
  });
  it("sends money to the winner and resets the players array", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });
    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({ from: accounts[0] });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    assert(difference > web3.utils.toWei("1.9", "ether"));
  });
});
