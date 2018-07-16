import React, { PureComponent } from "react";
//  import Tabs from 'react-responsive-tabs';
import Tabs from "../components/index";

import dummyData from "../dummyData";

import "./styles.css";

export class Basic extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      showMore: true,
      transform: true,
      showInkBar: false,
      items: this.getSimpleTabs(),
      selectedTabKey: 0,
      multiSelectTab: false
    };
  }

  onChangeProp = propsName => evt => {
    this.setState({
      [propsName]:
        evt.target.type === "checkbox" ? evt.target.checked : +evt.target.value
    });
  };

  getSimpleTabs = () =>
    dummyData.map(({ name, biography }, index) => ({
      key: index,
      title: name,
      getContent: () => biography
    }));

  render() {
    const {
      showMore,
      transform,
      showInkBar,
      selectedTabKey,
      multiSelectTab
    } = this.state;
    return (
      <div className="basic__wrapper">
        <div className="basic__props">
          <div className="basic__prop">
            <label>
              <input
                type="checkbox"
                onChange={this.onChangeProp("showMore")}
                checked={showMore}
              />{" "}
              showMore
            </label>
          </div>
          <div className="basic__prop">
            <label>
              <input
                type="checkbox"
                onChange={this.onChangeProp("transform")}
                checked={transform}
              />{" "}
              {"transform to accordion when width < 800px"}
            </label>
          </div>
          <div className="basic__prop">
            <label>
              <input
                type="checkbox"
                onChange={this.onChangeProp("showInkBar")}
                checked={showInkBar}
              />{" "}
              showInkBar
            </label>
          </div>
          <div className="basic__prop">
            <label>
              <input
                type="number"
                min={0}
                onChange={this.onChangeProp("selectedTabKey")}
                className="basic__input"
                value={selectedTabKey}
              />{" "}
              selected tab
            </label>
          </div>
          <div className="basic__prop">
            <label>
              <input
                type="checkbox"
                onChange={this.onChangeProp("multiSelectTab")}
                checked={multiSelectTab}
              />{" "}
              multiple select tab
            </label>
          </div>
        </div>
        <div className="basic__tabs">
          <Tabs {...this.state} />
        </div>
      </div>
    );
  }
}

export default Basic;
