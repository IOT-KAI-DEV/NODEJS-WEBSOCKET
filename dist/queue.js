"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
class Queue {
    constructor(size) {
        this.storage = [];
        this.size = size;
    }
    // 
    push(item) {
        if (this.isFull()) {
            this.dequeue();
        }
        this.enqueue(item);
    }
    // memasukkan element hanya jika masih terdapat slot kosong 
    enqueue(item) {
        this.storage.push(item);
    }
    dequeue() {
        this.storage.shift();
    }
    all() {
        return this.storage;
    }
    isFull() {
        if (this.size === this.storage.length)
            return true;
        return false;
    }
}
exports.Queue = Queue;
//# sourceMappingURL=queue.js.map