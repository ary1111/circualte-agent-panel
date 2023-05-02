import React, { useRef, useEffect,useState } from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { locationService } from '@grafana/runtime';
import { RefreshEvent } from '@grafana/runtime';
import {HeatMap} from './HeatMap'
import axios from 'axios'

import * as d3 from '/Users/seanthammakhoune/Documents/GitHub/CirculateGrafanaPlugins/panels/circulate-agent-panel/node_modules/d3';

interface Props extends PanelProps<SimpleOptions> {}
// MAP Z TO Y
export const AgentPanel: React.FC<Props> = ({ options, data, width, height,timeRange,eventBus }) => {
  const svgRef = useRef(null);
  const xLim = [0,42]
  const yLim = [0,58]
  const colorContour = d3.interpolateSpectral;
  const [particleData, setParticleData] = useState( Array.from({length: xLim[1]},()=> Array.from({length: yLim[1]}, () => null)))
  const [particleCount, setParticleCount] = useState()
  const [currentZoomState, setCurrentZoomState] = useState();  
  const [resetZoom,setResetZoom] = useState(false)
  const [zoomToArea,setZoomToArea] = useState(false)
  const [focusArea,setFocusArea] = useState(false)
  const [selectedZone,setSelectedZone] = useState()
  const [newZone,setNewZone] = useState()
  const [xBBox, setXBBox] = useState()
  const [yBBox, setYBBox] = useState()
  // * Get zoom coordinates for heatmap (voxels)
  const [xMinCoord,setXMinCoord] = useState(xLim[0])
  const [xMaxCoord,setXMaxCoord] = useState(xLim[1])
  const [yMinCoord,setYMinCoord] = useState(yLim[0])
  const [yMaxCoord,setYMaxCoord] = useState(yLim[1])
  // * Get current list of saved zones from database
  const [currentSavedZones,setCurrentSavedZones] = useState([])
  useEffect(() => {
    const getZones = async () => {

      const result = await axios.get('https://7ginx0igjj.execute-api.us-east-1.amazonaws.com/dev/getdata').then((res)=>setCurrentSavedZones(res.data)).catch((err)=>console.log(err))
      }
      getZones();
},[]);
useEffect( () => {
  console.log(currentSavedZones)
},[currentSavedZones])
  function getDataArrFromGrafana(params) {
    let dataArray: any = [] // Initialize array to push
    let bufferArray = data.series.map((series) => series.fields.find((field) => field.name === params[0])).map((field) => field?.values)[0];
    if (bufferArray !== undefined){ // to satisfy typescript
      for (let i = 0;i < bufferArray.length;i++){//push data
        let obj ={}
        for (let j = 0; j < params.length;j++){
          obj[params[j]] = data.series.map((series) => series.fields.find((field) => field.name === params[j])).map((field) => field?.values.get(i))[0]
        }
        let values = Object.values(obj)
        if (values[0]!=null){
          dataArray.push(obj)
        }
      } 
    return dataArray
    } 
  }
  const heatMapParams = ['x','y','particle_count','time']
  const agentParams = ['PosX','PosY','agentName']

  // ! Test
  // * Initialization useEffect
  const heatmapData = getDataArrFromGrafana(heatMapParams)

  
  const agentData = getDataArrFromGrafana(agentParams)
  

  const floorPlanURL = options.url
  //check if floorPlanURL is invalid
  if (floorPlanURL.match(/\.(jpeg|jpg|gif|png)$/) == null){
    return <h1>Please enter a valid floorplan</h1>
  }
  //check if dimensions are valid
  const xMin = options.xMin
  const xMax = options.xMax
  const yMin = options.yMin
  const yMax = options.yMax
  if (xMin == null || xMax == null || yMin == null || yMax == null || yMin > yMax || xMin > xMax ){
    return <h1>Please enter valid dimensions</h1>
  }
  
  // * Get zoom coordinates for occupancy (meters)
  const [minXMeters,setMinXMeters] = useState(xMin)
  const [maxXMeters,setMaxXMeters] = useState(xMax)
  const [minYMeters,setMinYMeters] = useState(yMin)
  const [maxYMeters,setMaxYMeters] = useState(yMax)

  var img = new Image();
  img.addEventListener("load", function () {    
    });
  img.src = floorPlanURL;
  let aspectRatio = img.width/img.height
  aspectRatio = 0.704
  // Prevents infinite loop for rendering

  // Local storage for heatmap data
  // Button functionality
  
  const saveZoneClicked = () => {
    let zoneName = prompt("Please enter the zone name:", "Please enter the zone name");
    let saveZone = true
    // If zone already exists, alert
    for (let i = 0; i < currentSavedZones.length;i++){
      if (zoneName == currentSavedZones[i].zoneName){
        let override = prompt("Zone already exists! Click OK to override or enter a new zone name", "Please enter the zone name")
        if (override == null){
          saveZone = false
        }
        else if (override.length > 0){
          zoneName = override
        }
      }
    }
    const currentZone = {
      'zoneName':zoneName,
      'zoomState': JSON.stringify(currentZoomState),
      'xBBox':JSON.stringify(xBBox),
      'yBBox':JSON.stringify(yBBox)
    }
    if (saveZone == true){
      setCurrentSavedZones( currentSavedZones => [...currentSavedZones,currentZone])
      setNewZone(currentZone)
      axios.post('https://7ginx0igjj.execute-api.us-east-1.amazonaws.com/dev/postdata',currentZone).then((res)=>console.log(res)).catch((err)=>console.log(err))

    }

  };

  const resetClicked = () => {
    setResetZoom(true)
  }
  const zoomToClicked = () => {
    setZoomToArea(true)
  }
  // Populate dropdown list with initial list
  useEffect(() => {
  
  var div = document.getElementById('selectZone');
    while(div.firstChild){
        div.removeChild(div.firstChild);
    }
  var select = document.getElementById("selectZone");
  var el = document.createElement("option");
    el.text ="Select an area to zoom..."
    select.add(el)        
  //var selectFocus = document.getElementById("selectFocusZone")
  for(var i = 0; i < currentSavedZones.length; i++) {
    var zoneName = currentSavedZones[i].zoneName;
    var el = document.createElement("option");
    el.text = zoneName;
    el.value = zoneName;
    select.add(el);
    //selectFocus.add(el);
  }}, [currentSavedZones])
  // Populate second dropdown
  useEffect(() => {
    var div = document.getElementById('selectFocusZone');
    while(div.firstChild){
        div.removeChild(div.firstChild);
    }       
    var selectFocus = document.getElementById("selectFocusZone")
    var el = document.createElement("option");
    el.text ="Select a focus zone..."
    selectFocus.add(el)
    for(var i = 0; i < currentSavedZones.length; i++) {
      var zoneName = currentSavedZones[i].zoneName;
      var el = document.createElement("option");
      el.text = zoneName;
      el.value = zoneName;
      selectFocus.add(el);
    }}, [currentSavedZones])
  const selectZone = (event) =>{
    const selectedZoneName = event.target.value
    for(var i = 0; i < currentSavedZones.length; i++) {
      if (selectedZoneName == currentSavedZones[i].zoneName){
        setZoomToArea(true)
        setFocusArea(false)
        setSelectedZone(currentSavedZones[i])
      }
    }
  }
    const selectFocusZone = (event) =>{
      const selectedZoneName = event.target.value
      for(var i = 0; i < currentSavedZones.length; i++) {
        if (selectedZoneName == currentSavedZones[i].zoneName){
          setFocusArea(true)
          setSelectedZone(currentSavedZones[i])
        }
      }
    }
    
  //Refresh events
useEffect(() => {
  const subscriber = eventBus.getStream(RefreshEvent).subscribe(event => {
    
    locationService.partial({ 'var-xMinCoord': xMinCoord,
    'var-xMaxCoord':xMaxCoord,
    'var-yMinCoord': yMinCoord,
    'var-yMaxCoord': yMaxCoord,
    'var-xMinMeters': minXMeters,
    'var-xMaxMeters': maxXMeters,
    'var-yMinMeters': minYMeters,
    'var-yMaxMeters': maxYMeters,
    'var-particleCount': particleCount
  }, true);
    
    console.log(`Received event: ${event.type}`)
    
    
  })
  return () => {
    subscriber.unsubscribe();
  }
  
}, [eventBus,particleData,xMinCoord,xMaxCoord,yMinCoord,yMaxCoord,minXMeters,maxXMeters,minYMeters,maxYMeters]);
  useEffect(() => {
    const margin = { top: 20, left: 20, right: 20, bottom: 20 }
    height = width / aspectRatio;
    height = height - margin.top - margin.bottom
    width = width - margin.left - margin.right

    const svg = d3.select(svgRef.current)
      .attr("width",width + margin.left + margin.right)
      .attr("height",height + margin.top + margin.bottom)
    svg.selectAll("*").remove(); // clear the SVG on render
    const container = svg.append("g")
      .attr("class","mainContainer")
      
    // add image to the main container
    
    if (options.floorplan == true){
      container
      .append("svg:image")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height",height)
      .attr("opacity", 1)
      //.attr("preserveAspectRatio", "xMinYMin meet")
      .attr("xlink:href", floorPlanURL);
    }
    
      
      // Create scaling variables
    
    const x = d3.scaleLinear()
        .nice()
        .domain(xLim)
        .range([ 0, width ]);
    const xInv = d3.scaleLinear()
        .nice()
        .domain([ 0, width ])
        .range(xLim);
    const y = d3.scaleLinear()
        .nice()
        .domain(yLim)
        .range([ height,0 ]);
    const yInv = d3.scaleLinear()
      .nice()
      .domain([ height,0 ])
      .range(yLim);
    const heightInPx = y( yLim[1]-1 )
    const boxHeight =  heightInPx - y(yLim[1])
      // What is the width of a square in px?
    const widthInPx = x(xLim[0]+1)
    const boxWidth = widthInPx - x(xLim[0])

    // For meters
    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, width]);
    const xScaleInv = d3.scaleLinear().domain([0, width]).range([xMin, xMax]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);
    const yScaleInv = d3.scaleLinear().domain([height, 0]).range([yMin, yMax]);
    const addHeatMap = (container, data) =>{
      const binnedDataArray: any = [];
      let numParticles
      for (let i = 0; i < xLim[1]; i++) {
        for (let j = 0; j < yLim[1]; j++) {
          if (data[i][j]) {
            binnedDataArray.push({
              x: i,
              y: j,
              value: data[i][j],
            });
          }
        }
      }
      const minData = d3.min(binnedDataArray, function(d: any) {return d.value})
      const medianData = d3.median(binnedDataArray, function(d: any) {return d.value})
      const maxData = d3.max(binnedDataArray, function(d: any) {return d.value})
      const myColor = d3.scaleLinear<string, number>()
        .range(["#ece7f2", "#a6bddb", "#2b8cbe"])
        .domain([minData,
          medianData,
          maxData])
      container
        .append("g")
        .attr("transform", `translate(${widthInPx/2},${-heightInPx})`)        .selectAll("rect")
        .data(binnedDataArray)
        .enter()
        .append('rect')
        .attr("x", function(d: any) { return x(d.x); })
        .attr("y", function(d: any) { return y(d.y); })
        .attr("width",boxWidth)
        .attr("height", boxHeight )
        .attr("fill", function(d) { return myColor(d.value); })
        .append('title')
        .text(function(d: any) {return (d.value);});
        
        const linearGradient = container
        .append("linearGradient")
        .attr("id", "linear-gradient");
      linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");
      linearGradient
        .selectAll("stop")
        .data([
          { offset: "0%", color: "#ece7f2" },
          { offset: "50%", color: "#a6bddb" },
          { offset: "100%", color: "#2b8cbe" },
        ])
        .enter()
        .append("stop")
        .attr("offset", function (d: any) {
          return d.offset;
        })
        .attr("stop-color", function (d: any) {
          return d.color;
        });
        var legendWidth = width * 0.3,
        legendHeight = 8;
      //Color Legend container
      const legendsvg = container
        .append("g")
        .attr("id", "legend")
        .attr(
          "transform",
          "translate(" + ( legendWidth / 2) + "," + (height + margin.bottom - 35) + ")"
        );
      //Draw the Rectangle
      legendsvg
        .append("rect")
        .attr("class", "legendRect")
        .attr("x", -legendWidth / 2 + 0.5)
        .attr("y", 10)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)")
        .style("stroke", "white")
        .style("stroke-width", "1px");
      const xScale2 = d3
        .scaleLinear()
        .range([0, legendWidth])
        .domain([
          minData,
          maxData,
        ]);
      legendWidth = width * 0.3,
      legendHeight = 8;
      const xAxis = legendsvg
        .append("g")
        .call(
          d3.axisBottom(xScale2)
          .tickValues([
            minData,
            ((minData+maxData) / 2 + minData) / 2,
            (minData+maxData) / 2,
            ((minData+maxData) / 2 + maxData) / 2,
            maxData,
          ])
        )
        .attr("class", "legendAxis")
        .attr("id", "legendAxis")
        .attr(
          "transform",
          "translate(" + -legendWidth / 2 + "," + (10 + legendHeight) + ")"
        );
    }

    const addContours = (container: any, data: any, scale = 1) => {
      const binnedDataArray: any = [];
      for (let i = 0; i < xLim[1]; i++) {
        for (let j = 0; j < yLim[1]; j++) {
          if (data[i][j]) {
            binnedDataArray.push({
              x: i,
              y: j,
              value: data[i][j],
            });
          }
        }
      }
      const maxVal = d3.max(binnedDataArray, function(d: any) { return d.value; });
      //magic numbers with a sqrt bandwidth scale
      const bandwidthScale = d3.scaleSqrt().domain([1, 100]).range([7, 12]);
      
      const contours = d3
        .contourDensity()
        .size([width, height])
        // .x((d) => d.j * binSize + d3.randomUniform(binSize)())
        // .y((d) => d.i * binSize + d3.randomUniform(binSize)())
        .x(function(d: any) { return x(d.x); })
        .y(function(d: any) { return y(d.y)- heightInPx; })
        .weight(function(d: any) {return d.value;})
        .bandwidth(7)
        .thresholds(maxVal)(binnedDataArray);
      // .thresholds(20)(data)
      // (data)

      const dataRange = d3.extent(contours, function(d) { return d.value; }).reverse();
      if (dataRange[0]!== undefined){
        dataRange[0] = dataRange[0] / Math.sqrt(scale);
      }
      

      // dataRange[1] = dataRange[1] / Math.sqrt(scale);
      const scaledMax = 0.3 / Math.sqrt(scale);
      const color = d3.scaleSequential([scaledMax, 0], colorContour);
      //const color = d3.scaleSequential([scaledMax, 0], colorContour);

      //addLegend(scaledMax, color);
      
      container
        .append("g")
        //.attr("transform", `translate(${-binSize / 2},${binSize / 2})`)
        .classed("heatmap-contour", true)
        .selectAll("path")
        .data(contours)
        //.enter()
        .join("path")
        .attr("fill", function(d: any) { return color(d.value); })
        //.attr("stroke", () => (state.colorBlind ? "black" : "none"))
        .attr("opacity", 0.4)
        .attr("d", d3.geoPath())
        .append("title")
        .text((d: any) => `Value: ${d3.format(".4f")(d.value)}`);
        
    };
    
    if (options.heatmap === true){
      addHeatMap(container,particleData)
    }
    else if(options.contours === true){
      const scale = 1
      addContours(container, particleData, scale);
    }
    const buttonTest = 
      container
        .append('h')
        .attr('x', 50)
        .attr('y', 50)
        .attr('width', 25)
        .attr('height', 40)
        .text('hi')
        .attr('stroke', 'black')
        .attr('fill', '#69a3b2');
        
    
        buttonTest.on("click", () => {
          let zoneName = prompt("Please enter a zone to save:", "Please enter a zone");
          let zoneData = {
            name: zoneName,
            coords:
            {minXCoord: 6,
            maxXCoord: 21,
            minYCoord: 2,
            maxYCoord: 23} 
          }
          console.log(zoneData.coords)
        });
    
    const addAgents = (container, data) =>{
      
      const agentGroup = container
        .append("g")
        .selectAll("circle")
        .data(data)
        .enter()
      agentGroup
        .append('circle')
        .attr("cx", function(d: any) { return xScale(d.PosX); })
        .attr("cy", function(d: any) { return yScale(d.PosY); })
        .attr('r',5)
        .attr("fill", 'rgb(255,0,0')
        .append('title')
        .text(function(d: any) {return (d.x,d.y);});
      if (options.names == true){
        agentGroup
        .append("text")
        .attr("x", function(d: any) { return xScale(d.PosX); })
        .attr("y", function(d: any) { return yScale(d.PosY); })
        .attr("dy", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "grey")
        .text(function(d) {return d.agentName;});
      }
      
        
    }
    
    if (options.occupancy){
      addAgents(container,agentData)
    }
    function getVisibleArea(t) {
      var l = t.invert([0, 0]),
        r = t.invert([width, height]);
      const zoomedXLim = [(l[0]),(r[0])]
      const zoomedYLim = [(l[1]),(r[1])]
      setXBBox(zoomedXLim)
      setYBBox(zoomedYLim)

      // set bin coordinates to grab
      setXMinCoord(Math.trunc(xInv(zoomedXLim[0])) < 0 ? 1 : Math.trunc(xInv(zoomedXLim[0])) )
      setXMaxCoord(Math.trunc(xInv(zoomedXLim[1])) > xLim[1]? xLim[1] : Math.trunc(xInv(zoomedXLim[1])))
      setYMinCoord(Math.trunc(yInv(zoomedYLim[1])) < 0 ? 1 : Math.trunc(yInv(zoomedYLim[1])) )
      setYMaxCoord(Math.trunc(yInv(zoomedYLim[0])) > yLim[1] ? yLim[1] : Math.trunc(yInv(zoomedYLim[0])) )
      //set meter coordinates to grab
      setMinXMeters((xScaleInv(zoomedXLim[0])))
      setMaxXMeters((xScaleInv(zoomedXLim[1])))
      setMinYMeters((yScaleInv(zoomedYLim[1])))
      setMaxYMeters((yScaleInv(zoomedYLim[0])))

      // Calculate particle count in visible area
      
      
    }
    
    function zoomed (event: any) {
      getVisibleArea(d3.event.transform)
      const zoomState = d3.zoomTransform(svg.node() as any);
      setCurrentZoomState(zoomState);
      }
      //const zoom = d3.zoom().on('zoom', zoomed) as any
      const zoom = d3.zoom().extent([[0, 0], [width, height]]).scaleExtent([.9, 20]).translateExtent([
      [0, 0],
      [width, height]
    ]).on("zoom", zoomed) as any;
      svg.call(zoom)
      if (resetZoom == true){
        svg.transition().duration(200).call(zoom.transform, d3.zoomIdentity);
        setResetZoom(false)
      }
      
      if (zoomToArea == true){
        const zoneZoomState = JSON.parse(selectedZone.zoomState)
        const t = d3.zoomIdentity.translate(zoneZoomState.x,zoneZoomState.y).scale(zoneZoomState.k)
        svg.transition().duration(200).call(zoom.transform, t);
        setZoomToArea(false)
      }
      if (focusArea == true){
        const zoneXBBox = JSON.parse(selectedZone.xBBox)
        const zoneYBBox = JSON.parse(selectedZone.yBBox)
        console.log("X",selectedZone.xBBox)
        console.log("Y",selectedZone.yBBox)
        var rectData = [{x1: 0, x2: 0, y1: 0, y2: 0}, 
          {x1: zoneXBBox[0], x2: zoneXBBox[1], y1: zoneYBBox[0], y2: zoneYBBox[1]}];
        console.log(rectData)
        container.selectAll("rect")
          .append("g")
          .data(rectData)
          .enter()
          .append("rect")
          .attr("x", d=> d.x1)
          .attr("y", d=> d.y1)
          .attr("width", d=> d.x2 - d.x1)
          .attr("height", d=> d.y2 - d.y1)
          
          .attr("fill", "teal")
          .attr("opacity", .5);
      }
    if (currentZoomState) container.attr("transform", currentZoomState);
      let cnt = 0
      for (let i = xMinCoord; i < xMaxCoord; i++){
        for (let j = yMinCoord; j < yMaxCoord; j++){
          cnt = cnt + particleData[i][j]
        }
      }
      // Calculate square meters 
      const widthInMeters = (xMaxCoord - xMinCoord) * boxWidth / (xMax - xMin)
      const heightInMeters = (yMaxCoord - yMinCoord) * boxHeight/ (yMax - yMin)
      setParticleCount(cnt/(widthInMeters*heightInMeters))
    
  },[xBBox,particleData,heatmapData,width,height,currentZoomState,agentData,particleCount,resetZoom,selectedZone]);
  return (
    <div>
      <button onClick={saveZoneClicked} className="play">Save Zone</button>
      <button onClick = {resetClicked}>Reset</button>
      <select id="selectZone" onChange = {selectZone}>
          <option>Zoom To Area</option>
      </select>
      <select id="selectFocusZone" onChange = {selectFocusZone}>
          <option>Select a focus zone</option>
      </select>
      <svg ref={svgRef}></svg>
    </div>
    
  );
  
  
};