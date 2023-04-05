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

        const root = d3.stratify()
            .parentId(i => i.parent)
            (this.data);

        const items = {};
        root.each(node => {
            let parent = this.d;
            if (node.data.parent) {
                parent = items[node.data.parent];
            }
            const i = items[node.data.id] = parent.append("div")
                .style("margin-left", "20px");
            if (!node.data.parent) {
                return;
            }
            if (node.data.link) {
                i.append("a")
                    .attr("href", node.data.link)
                    .attr("target", "_blank")
                    .text(node.data.name);
            } else {
                i.append("span")
                    .text(node.data.name);
            }
            if (node.data.deadline) {
                const deadline = d3.timeDay.count(App.today, node.data.deadline);
                let deadlineStr;
                if (deadline < -1) {
                    deadlineStr = `due ${deadline} days ago`;
                } else if (deadline == -1) {
                    deadlineStr = "due 1 day ago";
                } else if (deadline === 0) {
                    deadlineStr = "due today";
                } else if (deadline == 1) {
                    deadlineStr = "due tomorrow";
                } else {
                    deadlineStr = `due in ${deadline} days`;
                }
                i.append("span")
                    .classed("deadline", true)
                    .text(deadlineStr);
            }
        });
        root.eachAfter(node => {
            const i = items[node.data.id];
            if (!node.data.parent) {
                return;
            }
            i.append("i")
                .classed("add-item", true)
                .append("span")
                .text("+");
        });
    }

};
