// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const Matic = require('../matic/matic');
const config = require('./config');

// console.log("Matic", Matic);


cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },

        infoLabel: {
            default: null,
            type: cc.Label
        },
        balanceValue: {
            default: null,
            type: cc.Label
        },
        depositInputText: {
            default: null,
            type: cc.Label
        },
        depositButton: {
            default: null,
            type: cc.Button
        },
        transferAddressInputText: {
            default: null,
            type: cc.Label
        },
        transferAmountInputText: {
            default: null,
            type: cc.Label
        },
        transferButton: {
            default: null,
            type: cc.Button
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.logs = [];
        this.initMatic();

        this.balance = parseInt(cc.sys.localStorage.getItem('balance'));
        if (!this.balance) {
            this.balance = 0;
        }
        this.updateBalance();
        this.onCheckBalance();

        this.depositButton.node.on('click', this.onDepositToken, this);
        this.transferButton.node.on('click', this.onTransferToken, this);
    },

    // update (dt) {},

    initMatic() {
        // Create object of Matic
        this.matic = new Matic({
            maticProvider: config.MATIC_PROVIDER,
            parentProvider: config.PARENT_PROVIDER,
            rootChainAddress: config.ROOTCHAIN_ADDRESS,
            syncerUrl: config.SYNCER_URL,
            watcherUrl: config.WATCHER_URL,
            maticWethAddress: config.MATICWETH_ADDRESS,
        })
        this.matic.wallet = config.PRIVATE_KEY // prefix with `0x`
    },

    onCheckBalance() {
        const tokenAddress = config.MATIC_TEST_TOKEN; // token address on mainchain
        const from = config.FROM_ADDRESS; // from address

        this.matic.balanceOfERC20(from, tokenAddress, {
            // parent: true, // For token balance on Main network (false for Matic Network)
        }).then((hash) => {
            // action on Transaction success
            console.log(hash); // eslint-disable-line
            this.balance = hash;
            this.updateBalance();
        })
    },

    onDepositToken(element) {
        const token = config.ROPSTEN_TEST_TOKEN; // test token address
        const amount = this.depositInputText.string; // amount in wei
        const from = config.FROM_ADDRESS; // from address

        // disable button
        element.interactable = false;

        // Approve token
        this.matic
            .approveERC20TokensForDeposit(token, amount, {
                from,
                onTransactionHash: (hash) => {
                    // action on Transaction success
                    console.log(hash); // eslint-disable-line
                },
            })
            .then(() => {
                // Deposit tokens
                this.matic.depositERC20Tokens(token, from, amount, {
                    from,
                    onTransactionHash: (hash) => {
                        // action on Transaction success
                        console.log(hash); // eslint-disable-line
                    },
                    onReceipt: (receipt) => {
                        console.log(receipt);
                        setTimeout(() => {
                            element.interactable = true;
                            this.onCheckBalance();
                        }, 5000);
                    }
                })
            })

    },

    onTransferToken(element) {
        const token = config.MATIC_TEST_TOKEN; // test token address
        const recipient = this.transferAddressInputText.string; // address
        const amount = this.transferAmountInputText.string; // amount in wei
        const from = config.FROM_ADDRESS; // from address

        // disable button
        element.interactable = false;

        this.matic.transferTokens(token, recipient, amount, {
            from,
            // parent: true, // For token transfer on Main network (false for Matic Network)
            onTransactionHash: (hash) => {
                // action on Transaction success
                console.log(hash) // eslint-disable-line
            },
            onReceipt: (receipt) => {
                console.log(receipt);
                setTimeout(() => {
                    element.interactable = true;
                    this.onCheckBalance();
                }, 5000);
            }
        })
    },

    updateBalance() {
        this.balanceValue.string = this.balance + " Wei";
        cc.sys.localStorage.setItem("balance", this.balance.toString());
    },

    log(...args) {
        //cc.log(args);
        console.log(...args);

        if (this.logs.push(args) > 2) {
            this.logs.shift();
        }
        this.infoLabel.string = this.logs.toString().replace(',', '\n');
    }

});
