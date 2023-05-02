type SeriesSize = 'sm' | 'md' | 'lg';
type HeatmapType = 'agent' | 'surface'| 'hvac';
export interface SimpleOptions {
  url: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
  heatmap: boolean;
  floorplan: boolean;
  occupancy: boolean;
  heatmapType : HeatmapType
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  names: boolean,
  contours:boolean;
}
