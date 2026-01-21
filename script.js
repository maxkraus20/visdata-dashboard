const DATA_PATH = "./data/life-expectancy-un-vs-gdp-per-capita-wb.csv";

// global state
let fullData = [];
let selectedCountry = null;

// tooltip
const tooltip = d3.select("#tooltip");

// yearslider
const slider = d3.select("#yearSlider");
const yearLabel = d3.select("#yearLabel");

// =====================================================
// SCATTER (with year)
// =====================================================
const scatterCfg = {
  margin: { top: 30, right: 20, bottom: 45, left: 70 },
  width: 820,
  height: 420
};

const scatterSvg = d3.select("#scatter")
  .append("svg")
  .attr("viewBox", [0, 0, scatterCfg.width, scatterCfg.height]);

scatterSvg.append("text")
  .attr("class", "chart-title")
  .attr("x", scatterCfg.margin.left)
  .attr("y", 18)
  .text("Click a country (updates bar chart)");

const xScale = d3.scaleLog()
  .range([scatterCfg.margin.left, scatterCfg.width - scatterCfg.margin.right]);

const yScale = d3.scaleLinear()
  .range([scatterCfg.height - scatterCfg.margin.bottom, scatterCfg.margin.top]);

const rScale = d3.scaleSqrt().range([2, 18]);

const xAxisG = scatterSvg.append("g")
  .attr("transform", `translate(0, ${scatterCfg.height - scatterCfg.margin.bottom})`);

const yAxisG = scatterSvg.append("g")
  .attr("transform", `translate(${scatterCfg.margin.left}, 0)`);

scatterSvg.append("text")
  .attr("x", scatterCfg.width / 2)
  .attr("y", scatterCfg.height - 8)
  .attr("text-anchor", "middle")
  .text("GDP per capita (PPP, log scale)");

scatterSvg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("x", -scatterCfg.height / 2)
  .attr("y", 18)
  .attr("text-anchor", "middle")
  .text("Life expectancy (years)");

const dotsG = scatterSvg.append("g");

// =====================================================
// BAR CHART
// =====================================================
const countryCfg = {
  margin: { top: 45, right: 16, bottom: 45, left: 70 },
  width: 380,
  height: 420
};

const countrySvg = d3.select("#countrybars")
  .append("svg")
  .attr("viewBox", [0, 0, countryCfg.width, countryCfg.height]);

countrySvg.append("text")
  .attr("class", "chart-title")
  .attr("x", countryCfg.margin.left)
  .attr("y", 18)
  .text("Selected country: life expectancy over time");

const countryTitle = countrySvg.append("text")
  .attr("x", countryCfg.width / 2)
  .attr("y", 38)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("Click a country in the scatter plot");

const cx = d3.scaleBand()
  .padding(0.15)
  .range([countryCfg.margin.left, countryCfg.width - countryCfg.margin.right]);

const cy = d3.scaleLinear()
  .range([countryCfg.height - countryCfg.margin.bottom, countryCfg.margin.top]);

const cxAxisG = countrySvg.append("g")
  .attr("transform", `translate(0, ${countryCfg.height - countryCfg.margin.bottom})`);

const cyAxisG = countrySvg.append("g")
  .attr("transform", `translate(${countryCfg.margin.left}, 0)`);

// =====================================================
// REGION BAR
// =====================================================
const regionCfg = {
  margin: { top: 35, right: 16, bottom: 35, left: 140 },
  width: 820,
  height: 250
};

const regionSvg = d3.select("#regionchart")
  .append("svg")
  .attr("viewBox", [0, 0, regionCfg.width, regionCfg.height]);

regionSvg.append("text")
  .attr("class", "chart-title")
  .attr("x", regionCfg.margin.left)
  .attr("y", 18)
  .text("Region averages (in 2023)"); // just 2023 bc data only has region values in that year

const rx = d3.scaleLinear()
  .range([regionCfg.margin.left, regionCfg.width - regionCfg.margin.right]);

const ry = d3.scaleBand()
  .padding(0.2)
  .range([regionCfg.margin.top, regionCfg.height - regionCfg.margin.bottom]);

const rxAxisG = regionSvg.append("g")
  .attr("transform", `translate(0, ${regionCfg.height - regionCfg.margin.bottom})`);

const ryAxisG = regionSvg.append("g")
  .attr("transform", `translate(${regionCfg.margin.left}, 0)`);

// =====================================================
// TOP 10 COUNTRIES (with year)
// =====================================================
const topCfg = {
  margin: { top: 35, right: 16, bottom: 35, left: 140 },
  width: 380,
  height: 250
};

const topSvg = d3.select("#topchart")
  .append("svg")
  .attr("viewBox", [0, 0, topCfg.width, topCfg.height]);

topSvg.append("text")
  .attr("class", "chart-title")
  .attr("x", topCfg.margin.left)
  .attr("y", 18)
  .text("Top 10 life expectancy");

const tx = d3.scaleLinear()
  .range([topCfg.margin.left, topCfg.width - topCfg.margin.right]);

const ty = d3.scaleBand()
  .padding(0.2)
  .range([topCfg.margin.top, topCfg.height - topCfg.margin.bottom]);

const txAxisG = topSvg.append("g")
  .attr("transform", `translate(0, ${topCfg.height - topCfg.margin.bottom})`);

const tyAxisG = topSvg.append("g")
  .attr("transform", `translate(${topCfg.margin.left}, 0)`);

// =====================================================
// loading, cleaning, rendering
// =====================================================
d3.csv(DATA_PATH, d => ({
  entity: d["Entity"],
  code: d["Code"],
  year: +d["Year"],
  lifeExp: +d["Life expectancy - Sex: all - Age: 0 - Variant: estimates"],
  gdp: +d["GDP per capita, PPP (constant 2021 international $)"],
  population: +d["Population (historical)"],
  region: d["World regions according to OWID"]
})).then(data => {
  fullData = data.filter(d =>
    d.year >= 1990 && d.year <= 2023 && // most data in that range
    !isNaN(d.year) &&
    !isNaN(d.lifeExp) && d.lifeExp > 0 &&
    !isNaN(d.gdp) && d.gdp > 0 &&
    !isNaN(d.population) && d.population > 0 &&
    d.code && d.code.length === 3 // only country data

  );

  // init domains that depend on all data
  const gdpExtent = d3.extent(fullData, d => d.gdp);
  const lifeExtent = d3.extent(fullData, d => d.lifeExp);
  const popExtent = d3.extent(fullData, d => d.population);

  xScale.domain(gdpExtent);
  yScale.domain([Math.floor(lifeExtent[0]), Math.ceil(lifeExtent[1])]);
  rScale.domain(popExtent);

  xAxisG.call(d3.axisBottom(xScale).ticks(10));
  yAxisG.call(d3.axisLeft(yScale));

  // set slider range
  const years = Array.from(new Set(fullData.map(d => d.year))).sort((a,b)=>a-b);
  slider.attr("min", years[0]).attr("max", years[years.length - 1]);

  const initialYear = +slider.property("value") || years[years.length - 1];
  yearLabel.text(initialYear);

  // initial draw
  drawAll(initialYear);

  // update on slider
  slider.on("input", function(){
    const y = +this.value;
    yearLabel.text(y);
    drawAll(y);
  });

  // init empty selected-country chart
  initEmptyCountryBars();

}).catch(err => console.error(err));

// =====================================================
// Draw year-dependent views
// =====================================================
function drawAll(year){
  drawScatter(year);
  drawRegionBars(year);
  drawTop10(year);
}

// Scatter draw
function drawScatter(year){
  const yearData = fullData.filter(d => d.year === year);

  const dots = dotsG.selectAll("circle")
    .data(yearData, d => d.code);

  dots.exit().remove();

  dots.join(
    enter => enter.append("circle")
      .attr("cx", d => xScale(d.gdp))
      .attr("cy", d => yScale(d.lifeExp))
      .attr("r", d => rScale(d.population))
      .attr("fill", "#b2df8a")
      .attr("fill-opacity", 0.75)
      .attr("stroke", "#333")
      .attr("stroke-width", 0.6)
      .on("click", function(event, d){
        selectedCountry = { code: d.code, entity: d.entity };
        dotsG.selectAll("circle").classed("selected-dot", false);
        d3.select(this).classed("selected-dot", true);
        drawCountryBars(d.code, d.entity);
      })
      .on("mouseover", function(event, d){
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.entity}</strong><br>
             Region: ${(d.region || "N/A")}<br>
             Year: ${d.year}<br>
             Life Exp: ${d.lifeExp.toFixed(1)}<br>
             GDP: ${d.gdp.toLocaleString()}<br>
             Population: ${d.population.toLocaleString()}`
          );
      })
      .on("mousemove", function(event){
        tooltip
          .style("left", (event.clientX + 15) + "px")
          .style("top", (event.clientY + 15) + "px");
      })
      .on("mouseleave", function(){
        tooltip.style("opacity", 0);
      }),
    update => update
      .attr("cx", d => xScale(d.gdp))
      .attr("cy", d => yScale(d.lifeExp))
      .attr("r", d => rScale(d.population))
      .classed("selected-dot", d => selectedCountry && d.code === selectedCountry.code)
  );
}

// Selected country bars
function initEmptyCountryBars(){
  cx.domain([]);
  cy.domain([0, 100]);
  cxAxisG.call(d3.axisBottom(cx));
  cyAxisG.call(d3.axisLeft(cy));
}

function drawCountryBars(code, name){
  countrySvg.selectAll("rect.countrybar").remove();
  let series = fullData
    .filter(d => d.code === code && d.year >= 1990 && d.year <= 2023)
    .sort((a,b) => a.year - b.year);

  if (series.length === 0) {
    countryTitle.text("No data for selected country");
    return;
  }

  countryTitle.text(`${name} (1990-2023)`);

  cx.domain(series.map(d => d.year));
  cy.domain([
    d3.min(series, d => d.lifeExp) - 2,
    d3.max(series, d => d.lifeExp) + 2
  ]);

  cxAxisG.call(
    d3.axisBottom(cx)
      .tickValues(series.map(d => d.year).filter(y => y % 5 === 0))
      .tickFormat(d3.format("d"))
  );
  cyAxisG.call(d3.axisLeft(cy));

  const bars = countrySvg.selectAll("rect.countrybar")
    .data(series, d => d.year);

  bars.exit().remove();

  bars.join(
    enter => enter.append("rect")
      .attr("class", "countrybar")
      .attr("x", d => cx(d.year))
      .attr("y", d => cy(d.lifeExp))
      .attr("width", cx.bandwidth())
      .attr("height", d => (countryCfg.height - countryCfg.margin.bottom) - cy(d.lifeExp))
      .attr("fill", "#1f78b4")
      .attr("opacity", 0.85),
    update => update
      .attr("x", d => cx(d.year))
      .attr("y", d => cy(d.lifeExp))
      .attr("width", cx.bandwidth())
      .attr("height", d => (countryCfg.height - countryCfg.margin.bottom) - cy(d.lifeExp))
  );
}

// Region bars
function drawRegionBars(year){
  const yearData = fullData.filter(d => d.year === year && d.region);

  const grouped = d3.rollups(
    yearData,
    v => d3.mean(v, x => x.lifeExp),
    d => d.region
  ).map(([region, meanLife]) => ({ region, meanLife }))
   .sort((a,b) => a.meanLife - b.meanLife);

  if (grouped.length === 0) return;

  rx.domain([d3.min(grouped, d => d.meanLife) - 1, d3.max(grouped, d => d.meanLife) + 1]);
  ry.domain(grouped.map(d => d.region));

  rxAxisG.call(d3.axisBottom(rx).ticks(6));
  ryAxisG.call(d3.axisLeft(ry));

  const rMin = rx.domain()[0];

  const bars = regionSvg.selectAll("rect.regionbar")
    .data(grouped, d => d.region);

  bars.exit().remove();

  bars.join(
    enter => enter.append("rect")
      .attr("class", "regionbar")
      .attr("x", rx(rMin))
      .attr("y", d => ry(d.region))
      .attr("height", ry.bandwidth())
      .attr("width", d => rx(d.meanLife) - rx(rMin))
      .attr("fill", "#33a02c")
      .attr("opacity", 0.85),
    update => update
      .attr("x", rx(rMin))
      .attr("y", d => ry(d.region))
      .attr("height", ry.bandwidth())
      .attr("width", d => rx(d.meanLife) - rx(rMin))
  );
}

const topTitle = topSvg.append("text")
  .attr("class", "chart-title")
  .attr("x", topCfg.margin.left)
  .attr("y", 18)
  .text("Top 10 life expectancy");

// Top 10 countries
function drawTop10(year){
  topTitle.text(`Top 10 life expectancy (${year})`);
  const yearData = fullData.filter(d => d.year === year && d.entity);

  const byCode = new Map();
  yearData.forEach(d => { if (d.code) byCode.set(d.code, d); });

  const uniqueYear = Array.from(byCode.values());

  const top10 = uniqueYear
    .slice()
    .sort((a,b) => b.lifeExp - a.lifeExp)
    .slice(0, 10)
    .sort((a,b) => a.lifeExp - b.lifeExp);

  if (top10.length === 0) return;

  tx.domain([d3.min(top10, d => d.lifeExp) - 0.5, d3.max(top10, d => d.lifeExp) + 0.5]);
  ty.domain(top10.map(d => d.entity));

  txAxisG.call(d3.axisBottom(tx).ticks(5));
  tyAxisG.call(d3.axisLeft(ty).tickSizeOuter(0));

  const tMin = tx.domain()[0];

  const bars = topSvg.selectAll("rect.topbar")
    .data(top10, d => d.code);

  bars.exit().remove();

  bars.join(
    enter => enter.append("rect")
      .attr("class", "topbar")
      .attr("x", tx(tMin))
      .attr("y", d => ty(d.entity))
      .attr("height", ty.bandwidth())
      .attr("width", d => tx(d.lifeExp) - tx(tMin))
      .attr("fill", "#ff7f00")
      .attr("opacity", 0.85),
    update => update
      .attr("x", tx(tMin))
      .attr("y", d => ty(d.entity))
      .attr("height", ty.bandwidth())
      .attr("width", d => tx(d.lifeExp) - tx(tMin))
  );
}