import colors from 'modules/common/styles/colors';
import styled from 'styled-components';
import styledTS from 'styled-components-ts';
import { rgba } from 'modules/common/styles/color';
// props => props.color ? props.color : colors.colorPrimary
const LogBox = styledTS<{ color?: string }>(styled.div)`
  background-color: ${rgba(colors.bgGray, 0.6)} ;
  padding: 10px;
  margin: 10px;
  width: 47%;
  border-radius: 5px;

  .icon {
    margin-right: 5px;
  }

  > div {
    margin-bottom: 10px;
  }

  .field-name {
    font-weight: bold;
  }

  .field-value {
    padding-left: 10px;

    > div {
      display: inline-block;
    }
  } 

  &:hover {
    overflow: auto;
  }
`;

export { LogBox };
