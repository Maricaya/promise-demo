class Promise2 {
    state = 'pending'
    callbacks = []

    constructor(fn) {
        if (typeof fn !== "function") {
            throw new Error("只接受函数")
        }
        fn(this.resolve.bind(this), this.reject.bind(this))
    }
    resolve (result) {
        this.resolveOrReject('fulfilled', result, 0)
    }
    reject (reason) {
        this.resolveOrReject('rejected', reason, 1)
    }
    resolveOrReject (state, data, i) {
        process.nextTick(() => {
            if (this.state !== 'pending') {return}
            this.state = state
            this.callbacks.forEach(handle => {
                if (typeof handle[i] === 'function') {
                    let x = handle[i].call(undefined, data)
                    handle[2].resolveWith(x)
                }
            })
        })
    }
    then (succeed?, fail?) {
        const handle = []
        handle[0] = succeed
        handle[1] = fail
        handle[2] = new Promise2(() => {})
        this.callbacks.push(handle)
        return handle[2]
    }
    resolveWithSelf () {
        return this.reject(new TypeError())
    }
    resolveWithPromise (x) {
        x.then(result => {this.resolve(result)}, reason => {this.reject(reason)})
    }
    resolveWithObject (x) {
        let then
        try { then = x.then } catch (e) { this.reject(e) }
        if (then instanceof Function) {
            try { x.then(y => { this.resolveWith(y) }, r => { this.reject(r) }) }
            catch (e) { this.reject(e) }
        }
        else { this.resolve(x) }
    }
    resolveWith (x) {
        if (this === x) {
            this.resolveWithSelf();
        }
        else if (x instanceof Promise2) {
            this.resolveWithPromise(x);
        }
        else if (x instanceof Object) {
            this.resolveWithObject(x);
        }
        else { this.resolve(x) }
    }
}
export default Promise2