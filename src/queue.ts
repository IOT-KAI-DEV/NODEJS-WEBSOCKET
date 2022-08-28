interface IQueue<T> {
    // enqueue(item: T): void;
    // dequeue(): T | undefined;
    // size(): number;
}
export class Queue<T> implements IQueue<T> {
    protected storage: T[];
    protected size: number
    constructor(size: number){
        this.storage = [];
        this.size = size; 
    }

    // 
    public push(item: T) : void {
        if(this.isFull()) {
            this.dequeue()
        }

        this.enqueue(item)
    }
    // memasukkan element hanya jika masih terdapat slot kosong 
    public enqueue(item: T): void {
        this.storage.push(item)
    }

    public dequeue(): void {
        this.storage.shift()
    }

    public all() : T[] {
        return this.storage
    }

    protected isFull() : boolean {
        if(this.size === this.storage.length) return true;
        return false
    }
}