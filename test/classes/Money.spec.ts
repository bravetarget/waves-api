import { expect } from '../_helpers/getChai';
import * as WavesAPI from '../../dist/waves-api.min';


let Waves;
let Money;
let fakeWAVES;
let fakeEIGHT;
let fakeFOUR;
let fakeZERO;


describe('Money', () => {

    beforeEach((done) => {

        Waves = WavesAPI.create(WavesAPI.TESTNET_CONFIG);
        Money = Waves.Money;

        Promise.all([
            Waves.Asset.get({
                id: 'WAVES',
                name: 'Waves',
                precision: 8
            }),
            Waves.Asset.get({
                id: 'EIGHT',
                name: 'Eight Precision Token',
                precision: 8
            }),
            Waves.Asset.get({
                id: 'FOUR',
                name: 'Four Precision Token',
                precision: 4
            }),
            Waves.Asset.get({
                id: 'ZERO',
                name: 'Zero Precision Token',
                precision: 0
            })
        ]).then((assets) => {
            fakeWAVES = assets[0];
            fakeEIGHT = assets[1];
            fakeFOUR = assets[2];
            fakeZERO = assets[3];
        }).then(() => done());

    });

    describe('creating instances', () => {

        it('should be an instance of Money when created from tokens', (done) => {
            Money.fromTokens('10', fakeWAVES).then((money) => {
                expect(Money.isMoney(money)).to.be.true;
            }).then(() => done());
        });

        it('should be an instance of Money when created from coins', (done) => {
            Money.fromCoins('1000000000', fakeWAVES).then((money) => {
                expect(Money.isMoney(money)).to.be.true;
            }).then(() => done());
        });

        it('should create Money with Asset as the `asset` argument', (done) => {
            Promise.all([
                Money.fromCoins('1000', fakeWAVES),
                Money.fromTokens('1000', fakeWAVES)
            ]).then((moneys) => {
                expect(Money.isMoney(moneys[0])).to.be.true;
                expect(Money.isMoney(moneys[1])).to.be.true;
            }).then(() => done());
        });

        it('should create Money with asset ID as the `asset` argument', (done) => {
            Promise.all([
                Money.fromCoins('1000', fakeWAVES.id),
                Money.fromTokens('1000', fakeWAVES.id)
            ]).then((moneys) => {
                expect(Money.isMoney(moneys[0])).to.be.true;
                expect(Money.isMoney(moneys[1])).to.be.true;
            }).then(() => done());
        });

    });

    describe('core functionality', () => {

        it('should convert tokens to coins and vice versa', (done) => {

            const a = Money.fromCoins('100000000', fakeWAVES).then((money) => {
                expect(money.toTokens()).to.equal('1.00000000');
            });

            const b = Money.fromTokens('1', fakeWAVES).then((money) => {
                expect(money.toCoins()).to.equal('100000000');
            });

            const c = Money.fromCoins('10000', fakeFOUR).then((money) => {
                expect(money.toTokens()).to.equal('1.0000');
            });

            const d = Money.fromTokens('1', fakeFOUR).then((money) => {
                expect(money.toCoins()).to.equal('10000');
            });

            Promise.all([a, b, c, d]).then(() => done());

        });

        it('should drop insignificant digits', (done) => {

            const a = Money.fromTokens('1.123', fakeZERO).then((money) => {
                expect(money.toCoins()).to.equal('1');
            });

            const b = Money.fromTokens('10.1234567890', fakeWAVES).then((money) => {
                expect(money.toCoins()).to.equal('1012345678');
            });

            Promise.all([a, b]).then(() => done());

        });

    });

    describe('arithmetic operations', () => {

        it('should add Money with the same Asset', (done) => {
            Promise.all([
                Money.fromTokens('1.1', fakeWAVES),
                Money.fromTokens('1.9', fakeWAVES)
            ]).then((moneys) => {
                const result = moneys[0].add(moneys[1]);
                expect(Money.isMoney(result)).to.be.true;
                expect(result.toTokens()).to.equal('3.00000000');
            }).then(() => done());
        });

        it('should sub Money with the same Asset', (done) => {
            Promise.all([
                Money.fromTokens('3', fakeWAVES),
                Money.fromTokens('1.1', fakeWAVES)
            ]).then((moneys) => {
                const result = moneys[0].sub(moneys[1]);
                expect(Money.isMoney(result)).to.be.true;
                expect(result.toTokens()).to.equal('1.90000000');
            }).then(() => done());
        });

        it('should throw when Money instances have different Asset instances', (done) => {
            Promise.all([
                Money.fromTokens('1', fakeWAVES),
                Money.fromTokens('1', fakeFOUR)
            ]).then(([moneyOne, moneyTwo]) => {
                expect(() => moneyOne.add(moneyTwo)).to.throw();
            }).then(() => done());
        });

    });

    describe('conversions', () => {

        it('should convert Money to another instance of Money with another Asset [4, 8]', (done) => {
            Money.fromTokens('100', fakeFOUR).then((money) => {
                const changedMoney = Money.convert(money, fakeWAVES, 4);
                expect(changedMoney.toTokens()).to.equal('400.00000000');
            }).then(() => done());
        });

        it('should convert Money to another instance of Money with another Asset [8, 4]', (done) => {
            Money.fromTokens('100', fakeWAVES).then((money) => {
                const changedMoney = Money.convert(money, fakeFOUR, 0.25);
                expect(changedMoney.toTokens()).to.equal('25.0000');
            }).then(() => done());
        });

        it('should convert Money to another instance of Money with another Asset [8, 8]', (done) => {
            Money.fromTokens('100', fakeWAVES).then((money) => {
                const changedMoney = Money.convert(money, fakeEIGHT, 2);
                expect(changedMoney.toTokens()).to.equal('200.00000000');
            }).then(() => done());
        });

        it('should return the existing Money when it is being converted to Money with the same Asset', (done) => {
            Money.fromTokens('100', fakeWAVES).then((money) => {
                const changedMoney = Money.convert(money, fakeWAVES, 2);
                expect(changedMoney.toTokens()).to.equal('100.00000000');
                expect(changedMoney).to.equal(money);
            }).then(() => done());
        });

        it('should return a proper BigNumber instance (from tokens)', (done) => {
            Money.fromTokens('1.123', fakeWAVES).then((money) => {
                const coins = money.getCoins();
                expect(coins.isBigNumber).to.be.true;
                expect(coins.toFixed(0)).to.equal('112300000');
                const tokens = money.getTokens();
                expect(tokens.isBigNumber).to.be.true;
                expect(tokens.toFixed(8)).to.equal('1.12300000');
            }).then(() => done());
        });

        it('should return a proper BigNumber instance (from coins)', (done) => {
            Money.fromCoins('100000000', fakeWAVES).then((money) => {
                const coins = money.getCoins();
                expect(coins.isBigNumber).to.be.true;
                expect(coins.toFixed(0)).to.equal('100000000');
                const tokens = money.getTokens();
                expect(tokens.isBigNumber).to.be.true;
                expect(tokens.toFixed(8)).to.equal('1.00000000');
            }).then(() => done());
        });

        it('should convert to JSON', (done) => {
            Money.fromTokens('1000', fakeWAVES).then((money) => {
                expect(JSON.stringify(money)).to.equal('{"assetId":"WAVES","tokens":"1000.00000000"}');
            }).then(() => done());
        });

        it('should convert to a string', (done) => {
            Money.fromTokens('1000', fakeWAVES).then((money) => {
                expect(money.toString()).to.equal('1000.00000000 WAVES');
            }).then(() => done());
        });

    });

    describe('planned failures', () => {

        it('should throw an error when a numeric value is passed', () => {
            expect(() => Money.fromCoins(10, fakeWAVES)).to.throw();
            expect(() => Money.fromTokens(10, fakeWAVES)).to.throw();
        });

    });

});
