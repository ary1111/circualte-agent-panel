import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { AgentPanel } from './components/AgentPanel';

export const plugin = new PanelPlugin<SimpleOptions>(AgentPanel).setPanelOptions((builder) => {
  return builder
    // ! TODO text input
    // ! 1) Add name (public URL)
    // ! 2) Add Aspect ratio / dimensions in in pixel basis
    // ! 3) minX,maxX,minY,maxY in meters
    .addTextInput({
      path: 'text',
      name: 'Simple text option',
      description: 'Description of panel option',
      defaultValue: 'Default value of text input option',
    })
    .addTextInput({
      path: 'url',
      name: 'Floorplan URL',
      description: 'Enter URL of public floorplan',
      defaultValue: 'Enter URL of public floorplan',
    })
    .addNumberInput({
      path:'xMin',
      name:'Min X dimension',
    })
    .addNumberInput({
      path:'xMax',
      name:'Max X dimension',
    })
    .addNumberInput({
      path:'yMin',
      name:'Min Y dimension',
    })
    .addNumberInput({
      path:'yMax',
      name:'Max Y dimension',
    })
    .addBooleanSwitch({
      path: 'heatmap',
      defaultValue: false,
      name: 'Heatmap',
    })
    .addBooleanSwitch({
      path: 'contours',
      defaultValue: true,
      name: 'Contours',
    })
    .addBooleanSwitch({
      path: 'floorplan',
      defaultValue: true,
      name: 'Floor Plan',
    })
    .addBooleanSwitch({
      path: 'occupancy',
      defaultValue: true,
      name: 'Occupancy Data',
    })
    .addBooleanSwitch({
      path: 'names',
      defaultValue: false,
      name: 'Names of Occupants',
    });
});
