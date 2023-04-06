import { timeParse, timeFormat } from "d3";

class Entry {
    id;
    name;
    parent;
    deadline;
    status;
    lastAction;
    link;
}


export default class Data {
    static DATA_KEY = '__plan';
    static ROOT_NODE_ID = '__root';
    static parseDate = timeParse("%Y-%m-%d");
    static saveDate = timeFormat("%Y-%m-%d");


    static load() {
        let data = window.localStorage.getItem(this.DATA_KEY);
        if (data === null) {
            return new Data();
        }
        data = JSON.parse(data);
        return new Data(data);
    }

    constructor(data) {
        this.data = data || [];
        let rootAdded = false;
        let rootFound = false;
        for (let item of data) {
            if (!item.parent && item.id !== Data.ROOT_NODE_ID) {
                item.parent = Data.ROOT_NODE_ID;
                rootAdded = true;
            }
            if (item.id === Data.ROOT_NODE_ID) {
                rootFound = true;
            }
            if (item.deadline) {
                item.deadline = Data.parseDate(item.deadline);
            }
        }
        if (rootAdded && !rootFound) {
            this.data.push({
                id: Data.ROOT_NODE_ID,
                parent: '',
                name: ''
            })
        }
    }

    save() {
        for (let item of this.data) {
            if (item.deadline && item.deadline instanceof Date) {
                item.deadline = Data.saveDate(item.deadline);
            }
        }
        window.localStorage.setItem(Data.DATA_KEY, JSON.stringify(this.data));
    }

    set(entries) {
        this.data = entries;
        this.save();
    }

    [Symbol.iterator]() {
        return this.data[Symbol.iterator]();
    }
};
