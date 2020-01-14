import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
chai.use(sinonChai)

const assert = chai.assert
import Promise from '../src/index'
import { resolve } from 'dns'

describe("Promise", () => {
    it('是一个类', () => {
        assert.isFunction(Promise)
        assert.isObject(Promise.prototype)
    })
    it('new Promise() 如果接受不是函数，就报错', () => {
        // 预测会报错 assert.throw
        assert.throw(() => {
            // @ts-ignore
            new Promise()
        })
        assert.throw(() => {
            // @ts-ignore
            new Promise(1)
        })
    })
    it('new Promise(fn) 会生成一个对象，对象有then方法', () => {
        const promise = new Promise(() => { })
        assert.isFunction(promise.then)
    })
    it('new Promise(fn) 中的fn立即执行', () => {
        let fn = sinon.fake()
        new Promise(fn)
        assert(fn.called)
    })
    it('new Promise(fn) 中fn执行的时候接受resolve和reject两个函数', done => {
        new Promise((resolve, reject) => {
            assert.isFunction(resolve)
            assert.isFunction(reject)
            done()
            // 保证执行了
        })
    })
    it('promise.then(success) 中的success 会在resolve被调用的时候执行', done => {
        const success = sinon.fake()
        const promise = new Promise((resolve, reject) => {
            // 该函数没有执行
            assert.isFalse(success.called)
            resolve()
            // 该函数执行了
            setTimeout(() => {
                assert.isTrue(success.called)
                // 告诉mocha测试完成
                done()
            })
        })
        promise.then(success)
    })
    it('promise.then(null, fail) 中的 fail 会在reject被调用的时候执行', done => {
        const fail = sinon.fake()
        const promise = new Promise((resolve, reject) => {
            // 该函数没有执行
            assert.isFalse(fail.called)
            reject()
            // 该函数执行了
            setTimeout(() => {
                assert.isTrue(fail.called)
                // 告诉mocha测试完成
                done()
            })
        })
        promise.then(null, fail)
    })
    it('2.2.1', () => {
        const promise = new Promise(resolve => {
            resolve()
        })
        promise.then(false, null)
        assert(1 === 1)
    })
    it('2.2.2', done => {
        const succeed = sinon.fake()
        const promise = new Promise(resolve => {
            console.log(promise)
            assert.isFalse(succeed.called)
            resolve(233)
            resolve(233)
            setTimeout(() => {
                assert(promise.state === 'fulfilled')
                assert.isTrue(succeed.calledOnce)
                assert(succeed.calledWith(233))
                done()
            }, 0)
        })
        promise.then(succeed)
    })
    it('2.2.3', done => {
        const fail = sinon.fake()
        const promise = new Promise((resolve, reject) => {
            assert.isFalse(fail.called)
            reject(233)
            reject(233)
            setTimeout(() => {
                assert(promise.state === 'rejected')
                assert.isTrue(fail.calledOnce)
                assert(fail.calledWith(233))
                done()
            }, 0)
        })
        promise.then(null, fail)
    })
    it('2.2.4 当我的代码没有执行完成时，不得调用then后面的俩函数', done => {
        const succeed = sinon.fake()
        const promise = new Promise(resolve => {
            resolve()
        })
        promise.then(succeed)
        assert.isFalse(succeed.called)
        setTimeout(() => {
            assert.isTrue(succeed.called)
            done()
        }, 0)
    })
    it('2.2.4 失败回调', done => {
        const fn = sinon.fake()
        const promise = new Promise((resolve, reject) => {
            reject()
        })
        promise.then(null, fn)
        assert.isFalse(fn.called)
        setTimeout(() => {
            assert.isTrue(fn.called)
            done()
        }, 0)
    })
    it('2.2.5 onFulfilled 和 onRejected 必须被当做函数调用（eg。不能有this传递过来）', done => {
        const promise = new Promise(resolve => {
            resolve()
        })
        promise.then(function() {
            'use strict'
            // 保证，给的this是空的，就为undefined
            assert(this === undefined)
            done()
        })
    })
    it('2.2.6 then可以在一个promise里被多次调用', done => {
        const promise = new Promise(resolve => {
            resolve()
        })
        const callbacks = [sinon.fake(), sinon.fake(), sinon.fake()]
        promise.then(callbacks[0])
        promise.then(callbacks[1])
        promise.then(callbacks[2])
        setTimeout(() => {
            assert(callbacks[0].called)
            assert(callbacks[1].called)
            assert(callbacks[2].called)
            assert(callbacks[1].calledAfter(callbacks[0]))
            assert(callbacks[2].calledAfter(callbacks[1]))
            done()
        }, 0)
    })
    it('2.2.6.2 then可以在一个promise里被多次调用', done => {
        const promise = new Promise((resolve, reject) => {
            reject()
        })
        const callbacks = [sinon.fake(), sinon.fake(), sinon.fake()]
        promise.then(null, callbacks[0])
        promise.then(null, callbacks[1])
        promise.then(null, callbacks[2])
        setTimeout(() => {
            assert(callbacks[0].called)
            assert(callbacks[1].called)
            assert(callbacks[2].called)
            assert(callbacks[1].calledAfter(callbacks[0]))
            assert(callbacks[2].calledAfter(callbacks[1]))
            done()
        }, 0)
    })
    it('2.2.7 then 必须返回一个promise', () => {
        const promise = new Promise((resolve) => {
            resolve()
        })
        const promise2 = promise.then(() => {}, () => {})
        assert(promise2 instanceof Promise)
    })
    it('2.2.7.1 如果then(success, fail) 中的 success 返回一个值x，运行Promise Resolution Procedure  [[Resolve]](promise2, x)', done => {
        const promise1 = new Promise((resolve) => {
            resolve()
        })
        promise1
            .then(() => 'success', () => {})
            .then(result => {
                assert.equal(result, 'success')
                done()
            })
    })
    it('2.2.7.1.2 x是一个Promise实例', done => {
        const promise1 = new Promise((resolve) => {
            resolve()
        })
        const fn = sinon.fake()
        const promise2 =  promise1
            .then(() => new Promise(resolve => resolve()), () => {})
        promise2.then(fn)
        setTimeout(() => {
            assert(fn.called)
            done()
        })
    })
    it('2.2.7.1.2 x是一个Promise实例, 且失败了', done => {
        const promise1 = new Promise((resolve) => {
            resolve()
        })
        const fn = sinon.fake()
        const promise2 =  promise1
            .then(() => new Promise((resolve, reject) => reject()))
        promise2.then(null, fn)
        setTimeout(() => {
            assert(fn.called)
            done()
        })
    })
})
