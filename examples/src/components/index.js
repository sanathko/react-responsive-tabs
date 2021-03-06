import React, { Component } from "react";
import ResizeDetector from "react-resize-detector";
import cs from "classnames";
import throttle from "lodash.throttle";
import PropTypes from "prop-types";
import ShowMore from "./ShowMore";
import Tab from "./Tab";
import TabPanel from "./TabPanel";
import InkBar from "./InkBar";

const tabPrefix = "tab-";
const panelPrefix = "panel-";

export default class Tabs extends Component {
  constructor(props) {
    super(props);

    this.tabRefs = {};

    this.state = {
      tabDimensions: {},
      blockWidth: 0,
      tabsTotalWidth: 0,
      showMoreWidth: 40,
      selectedTabKey: props.selectedTabKey,
      focusedTabKey: null,
      selectedTabs: props.selectedTabs
    };

    this.onResizeThrottled = throttle(this.onResize, props.resizeThrottle, {
      trailing: true
    });
  }

  componentDidMount() {
    this.setTabsDimensions();
  }

  componentWillReceiveProps(nextProps) {
    const { items, selectedTabs } = this.props;
    const { selectedTabKey } = this.state;
    const newState = {};
    if (items !== nextProps.items) {
      newState.blockWidth = 0;
    }

    if (nextProps.multiSelectTab) {
      if (selectedTabs !== nextProps.selectedTabs) {
        newState.selectedTabs = nextProps.selectedTabs;
      }
    }

    if (selectedTabKey !== nextProps.selectedTabKey) {
      newState.selectedTabKey = nextProps.selectedTabKey;
    }

    if (Object.keys(newState).length) {
      this.setState(newState);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { selectedTabKey, blockWidth, showMoreWidth } = this.state;
    const updateCondition =
      this.props.items !== nextProps.items ||
      nextProps.transform !== this.props.transform ||
      nextProps.showMore !== this.props.showMore ||
      nextProps.showInkBar !== this.props.showInkBar ||
      nextProps.allowRemove !== this.props.allowRemove ||
      nextProps.removeActiveOnly !== this.props.removeActiveOnly ||
      nextState.blockWidth !== blockWidth ||
      nextState.showMoreWidth !== showMoreWidth;
    if (nextProps.multiSelectTab) {
      return (
        updateCondition ||
        nextState.selectedTabKey !== selectedTabKey ||
        nextState.selectedTabKey === selectedTabKey ||
        this.props.selectedTabs.length !== nextProps.selectedTabs.length
      );
    }
    return updateCondition || nextState.selectedTabKey !== selectedTabKey;
  }

  componentDidUpdate() {
    if (!this.state.blockWidth) {
      this.setTabsDimensions();
    }
  }

  onResize = () => {
    if (this.tabsWrapper) {
      this.setState({ blockWidth: this.tabsWrapper.offsetWidth });
    }
  };

  onChangeTab = selectedTabKey => {
    if (this.props.multiSelectTab) {
      const index = this.state.selectedTabs.indexOf(selectedTabKey);
      if (index !== -1) {
        this.setState((previousState, props) => {
          return {
            selectedTabKey,
            selectedTabs: this.state.selectedTabs.filter(
              selectedTab => selectedTab !== selectedTabKey
            )
          };
        });
      } else {
        this.setState((previousState, props) => {
          return {
            selectedTabKey,
            selectedTabs: [...this.state.selectedTabs, selectedTabKey]
          };
        });
      }
    } else {
      this.setState({ selectedTabKey });
    }

    if (this.props.onChange) {
      this.props.onChange(selectedTabKey);
    }
  };

  onFocusTab = focusedTabKey => () => this.setState({ focusedTabKey });

  onBlurTab = () => this.setState({ focusedTabKey: null });

  onKeyDown = event => {
    if (event.keyCode === 13 && this.state.focusedTabKey !== null) {
      this.setState({ selectedTabKey: this.state.focusedTabKey });
    }
  };

  setTabsDimensions = () => {
    if (!this.tabsWrapper) {
      // it shouldn't happens evern. Just paranoic check
      return;
    }

    // initial wrapper width calculation
    const blockWidth = this.tabsWrapper.offsetWidth;

    // calculate width and offset for each tab
    let tabsTotalWidth = 0;
    const tabDimensions = {};
    Object.keys(this.tabRefs).forEach(key => {
      if (this.tabRefs[key]) {
        const width = this.tabRefs[key].tab.offsetWidth;
        tabDimensions[key.replace(tabPrefix, "")] = {
          width,
          offset: tabsTotalWidth
        };
        tabsTotalWidth += width;
      }
    });

    this.setState({ tabDimensions, tabsTotalWidth, blockWidth });
  };

  getTabs = () => {
    const {
      showMore,
      transform,
      transformWidth,
      items,
      allowRemove,
      removeActiveOnly,
      onRemove
    } = this.props;
    const {
      blockWidth,
      tabsTotalWidth,
      tabDimensions,
      showMoreWidth
    } = this.state;
    const selectedTabKey = this.getSelectedTabKey();
    const collapsed = blockWidth && transform && blockWidth < transformWidth;

    let tabIndex = 0;
    let availableWidth =
      blockWidth - (tabsTotalWidth > blockWidth ? showMoreWidth : 0);

    return items.reduce(
      (result, item, index) => {
        const {
          key = index,
          title,
          content,
          getContent,
          disabled,
          tabClassName,
          panelClassName
        } = item;

        const selected = selectedTabKey === key;
        const payload = { tabIndex, collapsed, selected, disabled, key };
        const tabPayload = {
          ...payload,
          title,
          onRemove: evt => {
            if (typeof onRemove === "function") {
              onRemove(key, evt);
            }
          },
          allowRemove: allowRemove && (!removeActiveOnly || selected),
          className: tabClassName
        };

        const panelPayload = {
          ...payload,
          content,
          getContent,
          className: panelClassName
        };

        const tabWidth = tabDimensions[key] ? tabDimensions[key].width : 0;

        tabIndex += 1;

        /* eslint-disable no-param-reassign */
        if (
          // don't need to `Show more` button
          !showMore ||
          // initial call
          !blockWidth ||
          // collapsed mode
          collapsed ||
          // all tabs are fit into the block
          blockWidth > tabsTotalWidth ||
          // current tab fit into the block
          availableWidth - tabWidth > 0
        ) {
          result.tabsVisible.push(tabPayload);
        } else {
          result.tabsHidden.push(tabPayload);
          if (selected) result.isSelectedTabHidden = true;
        }
        /* eslint-enable no-param-reassign */

        result.panels[key] = panelPayload; // eslint-disable-line no-param-reassign
        availableWidth -= tabWidth;

        return result;
      },
      {
        tabsVisible: [],
        tabsHidden: [],
        panels: {},
        isSelectedTabHidden: false
      }
    );
  };

  getTabProps = ({
    title,
    key,
    selected,
    collapsed,
    tabIndex,
    disabled,
    className,
    onRemove,
    allowRemove
  }) => ({
    selected,
    allowRemove,
    children: title,
    key: tabPrefix + key,
    id: tabPrefix + key,
    ref: e => (this.tabRefs[tabPrefix + key] = e),
    originalKey: key,
    onClick: this.onChangeTab,
    onFocus: this.onFocusTab,
    onBlur: this.onBlurTab,
    onRemove,
    panelId: panelPrefix + key,
    expanded: this.isExpanded(key),
    multiSelectTab: this.props.multiSelectTab,
    classNames: this.getClassNamesFor("tab", {
      selected,
      collapsed,
      tabIndex,
      disabled,
      className,
      expanded: this.isExpanded(key)
    })
  });

  getPanelProps = ({ key, content, getContent, className }) => ({
    getContent,
    children: content,
    key: panelPrefix + key,
    id: panelPrefix + key,
    tabId: tabPrefix + key,
    classNames: this.getClassNamesFor("panel", { className })
  });

  getShowMoreProps = (isShown, isSelectedTabHidden, showMoreLabel) => ({
    onShowMoreChanged: this.showMoreChanged,
    isShown,
    label: showMoreLabel,
    hasChildSelected: isSelectedTabHidden
  });

  getClassNamesFor = (
    type,
    { selected, collapsed, tabIndex, disabled, expanded, className = "" }
  ) => {
    switch (type) {
      case "tab":
        return cs("RRT__tab", className, this.props.tabClass, {
          "RRT__tab--first": !tabIndex,
          "RRT__tab--selected":
            (this.props.multiSelectTab && !collapsed && selected) ||
            (!this.props.multiSelectTab && selected),
          "RRT__tab--disabled": disabled,
          "RRT__tab--collapsed": collapsed,
          "RRT__tab--expanded":
            this.props.multiSelectTab && collapsed && expanded
        });
      case "panel":
        return cs("RRT__panel", className, this.props.panelClass);
      default:
        return "";
    }
  };

  getSelectedTabKey = () => {
    const { items } = this.props;
    const { selectedTabKey } = this.state;

    if (typeof selectedTabKey === "undefined") {
      if (!items[0]) {
        return undefined;
      }

      return items[0].key || 0;
    }

    return selectedTabKey;
  };

  isExpanded = key => {
    return this.state.selectedTabs.includes(key);
  };

  showMoreChanged = element => {
    if (!element) {
      return;
    }

    const showMoreWidth = element.offsetWidth;
    if (this.state.showMoreWidth === showMoreWidth) {
      return;
    }

    this.setState({
      showMoreWidth
    });
  };

  render() {
    const {
      showInkBar,
      containerClass,
      tabsWrapperClass,
      showMore,
      transform,
      transformWidth,
      showMoreLabel
    } = this.props;
    const { tabDimensions, blockWidth } = this.state;
    const {
      tabsVisible,
      tabsHidden,
      panels,
      isSelectedTabHidden
    } = this.getTabs();
    const collapsed = blockWidth && transform && blockWidth < transformWidth;
    const selectedTabKey = this.getSelectedTabKey();
    const selectedTabDimensions = tabDimensions[selectedTabKey] || {};

    const containerClasses = cs("RRT__container", containerClass);
    const tabsClasses = cs("RRT__tabs", tabsWrapperClass, {
      RRT__accordion: collapsed
    });

    return (
      <div
        className={containerClasses}
        ref={e => (this.tabsWrapper = e)}
        onKeyDown={this.onKeyDown}
      >
        <div className={tabsClasses}>
          {tabsVisible.reduce((result, tab) => {
            result.push(<Tab {...this.getTabProps(tab)} />);
            if (collapsed) {
              if (this.props.multiSelectTab) {
                if (this.state.selectedTabs.includes(tab.key)) {
                  result.push(
                    <TabPanel {...this.getPanelProps(panels[tab.key])} />
                  );
                }
              } else if (selectedTabKey === tab.key) {
                result.push(
                  <TabPanel {...this.getPanelProps(panels[tab.key])} />
                );
              }
            }
            return result;
          }, [])}

          {!collapsed && (
            <ShowMore
              {...this.getShowMoreProps(
                showMore,
                isSelectedTabHidden,
                showMoreLabel
              )}
            >
              {tabsHidden.map(tab => <Tab {...this.getTabProps(tab)} />)}
            </ShowMore>
          )}
        </div>

        {showInkBar &&
          !collapsed &&
          !isSelectedTabHidden && (
            <InkBar
              left={selectedTabDimensions.offset || 0}
              width={selectedTabDimensions.width || 0}
            />
          )}

        {!collapsed &&
          panels[selectedTabKey] && (
            <TabPanel {...this.getPanelProps(panels[selectedTabKey])} />
          )}

        {(showMore || transform) && (
          <ResizeDetector handleWidth onResize={this.onResizeThrottled} />
        )}
      </div>
    );
  }
}

Tabs.propTypes = {
  /* eslint-disable react/no-unused-prop-types */
  // list of tabs
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  //  list of selected tabs
  selectedTabs: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  /* eslint-enable react/no-unused-prop-types */
  // selected tab key
  selectedTabKey: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  // show 'X' and remove tab
  allowRemove: PropTypes.bool,
  multiSelectTab: PropTypes.bool,
  // show 'X' closing element only for active tab
  removeActiveOnly: PropTypes.bool,
  // move tabs to the special `Show more` tab if they don't fit into a screen
  showMore: PropTypes.bool,
  // materialUI-like rail under the selected tab
  showInkBar: PropTypes.bool,
  // transform to the accordion on small screens
  transform: PropTypes.bool,
  // tabs will be transformed to accodrion for screen sizes below `transformWidth`px
  transformWidth: PropTypes.number,
  // onChange active tab callback
  onChange: PropTypes.func,
  // onRemove callback
  onRemove: PropTypes.func,
  // frequency of onResize recalculation fires
  resizeThrottle: PropTypes.number,
  // classnames
  containerClass: PropTypes.string,
  tabsWrapperClass: PropTypes.string,
  tabClass: PropTypes.string,
  panelClass: PropTypes.string,
  // labels
  showMoreLabel: PropTypes.string
};

Tabs.defaultProps = {
  items: [],
  selectedTabs: [0],
  selectedTabKey: undefined,
  showMore: true,
  multiSelectTab: false,
  showInkBar: false,
  allowRemove: false,
  removeActiveOnly: false,
  transform: true,
  transformWidth: 800,
  resizeThrottle: 100,
  containerClass: undefined,
  tabsWrapperClass: undefined,
  tabClass: undefined,
  panelClass: undefined,
  showMoreLabel: "...",
  onChange: () => null,
  onRemove: () => null
};
