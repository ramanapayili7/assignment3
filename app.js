// Set dimensions
const width = 800,
    height = 600;

// Append SVG
const svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Tooltip
const tooltip = d3.select("#tooltip");

// Load data
d3.json("data.json").then((data) => {
    // Define top 10 countries and colors
    const topCountries = [
        "USA",
        "India",
        "Germany",
        "France",
        "UK",
        "China",
        "Japan",
        "Canada",
        "Italy",
        "Australia",
    ];
    const colorScale = d3
        .scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10);

    const getColor = (d) =>
        topCountries.includes(d.country) ? colorScale(d.country) : "#A9A9A9";

    // Initialize simulation
    const simulation = d3
        .forceSimulation(data.nodes)
        .force(
            "link",
            d3
                .forceLink(data.links)
                .id((d) => d.id)
                .strength(0.5),
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
            "collide",
            d3.forceCollide().radius((d) => d.sharedPubs * 2 + 3),
        );

    // Draw links
    const link = svg
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke", "#aaa");

    // Draw nodes
    const node = svg
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", (d) =>
            d3.scaleSqrt().domain([1, 20]).range([3, 12])(d.sharedPubs),
        )
        .style("fill", (d) => getColor(d))
        .call(drag(simulation));

    // Tooltip interaction
    node.on("click", (event, d) => {
        tooltip
            .style("display", "block")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .html(
                `<strong>${d.id}</strong><br>Affiliation: ${d.affiliation}<br>Country: ${d.country}`,
            );
    });

    svg.on("click", () => tooltip.style("display", "none"));

    // Hover interaction
    node.on("mouseover", (event, d) => {
        node.style("opacity", (o) =>
            o.affiliation === d.affiliation ? 1 : 0.2,
        );
        link.style("opacity", (o) =>
            o.source.affiliation === d.affiliation ||
            o.target.affiliation === d.affiliation
                ? 1
                : 0.2,
        );
    }).on("mouseout", () => {
        node.style("opacity", 1);
        link.style("opacity", 1);
    });

    // Update positions
    simulation.on("tick", () => {
        link.attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    // Drag behavior
    function drag(simulation) {
        return d3
            .drag()
            .on("start", (event) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", (event) => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", (event) => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            });
    }

    // Control sliders
    d3.select("#charge").on("input", function () {
        simulation.force("charge").strength(+this.value);
        simulation.alpha(1).restart();
    });

    d3.select("#linkStrength").on("input", function () {
        simulation.force("link").strength(+this.value);
        simulation.alpha(1).restart();
    });
});
