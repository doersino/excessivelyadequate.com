function generateBackgroundImage(X, Y) {
    var rand = Math.random;

    let cells = [];

    for (let x = 0; x < X; x++) {
        let row = [];
        for (let y = 0; y < Y; y++) {
            row.push(rand() > 0.5);
        }
        cells.push(row);
    }

    for (let i = 0; i < 10; i++) {
        let cells2 = [];
        for (let x = 0; x < cells.length; x++) {
            let row2 = [];
            for (let y = 0; y < cells[x].length; y++) {
                let cell = cells[x][y];

                let left = (x == 0) ? (cells.length - 1) : (x - 1);
                let right = (x == cells.length - 1) ? 0 : (x + 1);
                let above = (y == 0) ? (cells[x].length - 1) : (y - 1);
                let below = (y == cells[x].length - 1) ? 0 : (y + 1);

                let aboveNeighbor = cells[x][above];  // clockwise starting at 12
                let aboveRightNeighbor = cells[right][above];
                let rightNeighbor = cells[right][y];
                let belowRightNeighbor = cells[right][below];
                let belowNeighbor = cells[x][below];
                let belowLeftNeighbor = cells[left][below];
                let leftNeighbor = cells[left][y];
                let aboveLeftNeighbor = cells[left][above];

                let neighbors = aboveNeighbor + aboveRightNeighbor + rightNeighbor + belowRightNeighbor + belowNeighbor + belowLeftNeighbor + leftNeighbor + aboveLeftNeighbor;

                let cell2;
                if (cell && (neighbors == 2 || neighbors == 3)) {
                    cell2 = true;
                } else if (!cell && neighbors == 3) {
                    cell2 = true;
                } else {
                    cell2 = false;
                }

                row2.push(cell2);
            }
            cells2.push(row2);
        }
        cells = cells2;
    }

    var g = code => {
        let elem = document.createElementNS("http://www.w3.org/2000/svg", "g");
        elem.innerHTML = code;
        return elem;
    };

    var cross = (x,y) => {
        return `
            <path d="M ${x},${y}    L ${x+10},${y+10}"></path>
            <path d="M ${x},${y+10} L ${x+10},${y}   "></path>
        `
    };
    var circle = (x,y) => {
        return `<circle cx="${x+5}" cy="${y+5}" r="5"/>`
    }
    var triangle = (x,y) => {
        return `
            <path d="M ${x},${y} L ${x+10},${y} L ${x+5},${y+10} Z"></path>
        `
    }
    var plus = (x,y) => {
        return `
            <path d="M ${x+5},${y} L ${x+5},${y+10}"></path>
            <path d="M ${x},${y+5} L ${x+10},${y+5}"></path>
        `
    }
    var lines = (x,y) => {
        return `
            <path d="M ${x},${y+5}    L ${x+5},${y}"></path>
            <path d="M ${x+5},${y+10} L ${x+10},${y+5}"></path>
        `
    }
    var zigzag = (x,y) => {
        return `
            <path d="M ${x},${y+5} L ${x+2.5},${y} L ${x+5},${y+5} L ${x+7.5},${y+10} L ${x+10},${y+5}"></path>
        `
    }
    var shapes = [cross, circle, triangle, plus, lines, zigzag];

    var cell = (x,y) => {
        var acc = "";
        for (let n = 0; rand() / n > 0.2; n++) {
            let i = Math.floor(rand()*shapes.length);
            acc += shapes[i](-1+x+n,-1+y+n);
        }
        return acc;
    };

    var svg = document.querySelector("svg.bgtemp");
    svg.setAttribute("viewBox", `0 0 ${X*10} ${Y*10}`);
    for (let x = 0; x < X; x++) {
        for (let y = 0; y < Y; y++) {
            if (cells[x][y]) {
                svg.appendChild(g(cell(x*10,y*10)));
            }
        }
    }

    return svg;
}

// dynamically calculate time ago based on http://stackoverflow.com/a/3177838,
// used for progressive enhancement of post metadata
function ago(date) {
    function render(n, unit) {
        return n + " " + unit + ((n == 1) ? "" : "s") + " ago";
    }

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / (60 * 60 * 24 * 365));
    if (interval >= 1) {
        return render(interval, "year");
    }
    interval = Math.floor(seconds / (60 * 60 * 24 * 30));
    if (interval >= 1) {
        return render(interval, "month");
    }
    interval = Math.floor(seconds / (60 * 60 * 24));
    if (interval >= 1) {
        return render(interval, "day");
    }
    interval = Math.floor(seconds / (60 * 60));
    if (interval >= 1) {
        return render(interval, "hour");
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return render(interval, "minute");
    }
    interval = Math.floor(seconds);
    return render(interval, "second");
}
