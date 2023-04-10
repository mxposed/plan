import * as d3 from "d3";

import Data from "./data.js";


export default class App {
    static today = Date.now();

    run() {
        this.data = Data.load();
        this.body = d3.select(document.body);
        this.setupImport();
        this.draw();
    }

    setupImport() {
        d3.select(document)
            .on("dragenter", e => {
                e.stopPropagation();
                e.preventDefault();
            })
            .on("dragover", e => {
                e.stopPropagation();
                e.preventDefault();
            })
            .on("drop", e => {
                e.stopPropagation();
                e.preventDefault();

                this.processImport(e.dataTransfer.files);
            });
    }

    processImport(files) {
        if (files.length != 1) {
            console.log("Multiple inputs, please drag 1 csv file");
            return;
        }
        const file = files[0];
        if (file.type !== "text/csv") {
            console.log("Not a csv file, please drag 1 csv file");
            return;
        }
        file.text().then(text => {
            this.import(text);
        });
    }

    import(csv) {
        this.data.set(d3.csvParse(csv));
    }

    draw() {
        this.d = this.body.append("div")
            .classed("container", true);

        let root = d3.stratify()
            .parentId(i => i.parent)
            (this.data);
        root.eachAfter(node => {
            if (node.children === undefined) {
                if (node.data.deadline) {
                    node.deadline = d3.timeDay.count(App.today, node.data.deadline);
                    node.sortDeadline = node.deadline;
                    return;
                }
                node.sortDeadline = Infinity;
                return;
            }
            const deadlines = [];
            if (node.data.deadline) {
                node.deadline = d3.timeDay.count(App.today, node.data.deadline);
                deadlines.push(node.deadline);
            }
            for (let child of node.children) {
                deadlines.push(child.sortDeadline);
            }
            deadlines.sort((a, b) => a - b);
            node.sortDeadline = deadlines[0];
        });
        root = root.sort((a, b) => a.sortDeadline - b.sortDeadline);
        console.log(root);

        const items = {};
        root.each(node => {
            let parent = this.d;
            if (node.data.parent) {
                parent = items[node.data.parent];
            }
            const i = items[node.data.id] = parent.append("div");
            if (!node.data.parent) {
                return;
            }
            const n = i.append("b")
                .classed("header", true);
            let name = n.append("span")
                .classed("title", true)
                .text(node.data.name)
                .attr("contentEditable", true)
                .attr("spellcheck", false)
                .on("blur", () => {
                    node.data.name = name.text();
                    this.data.save();
                });
            if (node.data.link) {
                n.append("a")
                    .attr("href", node.data.link)
                    .attr("target", "_blank");
            }
            n.append("u");
            if (node.deadline) {
                let deadlineStr;
                if (node.deadline < -1) {
                    deadlineStr = `due ${node.deadline} days ago`;
                } else if (node.deadline == -1) {
                    deadlineStr = "due 1 day ago";
                } else if (node.deadline === 0) {
                    deadlineStr = "due today";
                } else if (node.deadline == 1) {
                    deadlineStr = "due tomorrow";
                } else {
                    deadlineStr = `due in ${node.deadline} days`;
                }
                n.append("span")
                    .classed("deadline", true)
                    .text(deadlineStr);
            }
        });
        root.eachAfter(node => {
            const i = items[node.data.id];
            i.append("i")
                .classed("add-item", true)
                .append("span")
                .text("+");
        });
    }

};
