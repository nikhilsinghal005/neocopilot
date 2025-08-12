import React from 'react';
import { themeIcons } from 'seti-file-icons';
import DOMPurify from 'dompurify';

interface LanguageIconProps {
  fileName: string;
  iconSize?: number;
}

const iconColors = {
  blue: '#268bd2',
  grey: '#657b83',
  'grey-light': '#839496',
  green: '#859900',
  orange: '#cb4b16',
  pink: '#d33682',
  purple: '#6c71c4',
  red: '#dc322f',
  white: '#fdf6e3',
  yellow: '#b58900',
  ignore: '#586e75'
};

const LanguageIcon: React.FC<LanguageIconProps> = ({ fileName, iconSize = 24 }) => {

  // Retrieve the icon SVG and color using the getIcon function
  const getIcon = themeIcons(iconColors);
  const { svg, color } = getIcon(fileName);

  // Return an empty div if no SVG is found
  if (!svg) {
    return <div />;
  }
  const sanitizedSvg = DOMPurify.sanitize(svg);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        style={{ width: `${iconSize}px`, height: `${iconSize}px`, fill: color || 'currentColor' }}
      />
    </div>
  );
};

export default LanguageIcon;
