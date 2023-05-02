import React from "react"
import * as d3 from 'd3';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';


interface Props extends PanelProps<SimpleOptions> {}

export const HeatMap: React.FC<Props> = ({ options, data, width, height,timeRange,eventBus }) => {
    console.log("HELLO FROM HEATMAP")
    return(
        <div>
        </div>
    )
    
}
