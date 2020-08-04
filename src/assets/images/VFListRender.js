import React, { Component, Fragment } from "react";
import { withTranslation } from "react-i18next";
import { connect } from "react-redux";
import {
  isUndefined,
  isNull,
  filter,
  groupBy,
  forEach,
  cloneDeep,
  find,
  findIndex,
  isArray,
  isNumber,
  isEmpty,
  differenceWith,
  isEqual,
  some,
  orderBy,
  compact,
  map,
  has,
  omit,
  assignIn
} from "lodash";
import {
  Selection,
  SelectionMode,
  IconButton,
  DirectionalHint,
  DefaultButton,
  PrimaryButton,
  ActionButton,
  MessageBarType,
  Link, HoverCard, HoverCardType,
  ProgressIndicator
} from "office-ui-fabric-react";
import { withRouter } from "react-router-dom";
import PubSub from "pubsub-js";

import { VFText } from "../../../Layout/layout";
import { PanelComponent, MessageBarComponent, DialogBoxComponent, ChoiceGroupComponent } from "../../../shared/shared";
import {
  VFFormCreator,
  VFListPropertyWindow
} from "../lazyUserInterfaceDesigner";
import ApolloClientService from "../../../../services/apolloclient";
import {
  onSetWizardComponent,
  onSetStateByForm,
  saveDataForm,
  tableDataForm,
  clearDataForm,
  saveCurrentOperation,
  onResetAllState,
  onTabStateByForm,
  dataFromDatabase,
  setTabValidations,
  setSuccessMessage,
  updateTabIndex,
  onResetMultiselect,
  dropdownSelection,
  setHeaderInfo,
  setConditionName,
  setUtilData
} from "../../../../redux/actions/VFFormAction";
import { API } from "../../../../services/GenericAPI.service";
import { updateLog } from "../../../../redux/actions/eventLogAction";
import { getExportData } from "../../../../worker";
import moment from "moment";
import { DEFAULT_FORMAT, DEFAULT_FORMAT_TIME } from "../../../utils/date";

const officeUIModule = require(`office-ui-fabric-react`);
var ctrl, ctrl2;

export class VFListRender extends Component {
  constructor(props) {
    super(props);
    this.trans = props.t;
    this.selection = new Selection({
      selectionMode:
        this.props.schema.selectionMode === 0
          ? SelectionMode.none
          : this.props.schema.selectionMode === 1
            ? SelectionMode.single
            : SelectionMode.multiple,
      onSelectionChanged: () => this.getSelectionDetails()
    });
    this.displayType = "";
    this.isDelegateError = false;
    this.state = {
      showDialogBox: false,
      showAlertBox: false,
      isBtnDisabled: false,
      isOverlay: false,
      selectionDetails: [],
      selectionData: [],
      schema: props.schema,
      showPanel: false,
      showNavigationPanel: false,
      action: undefined,
      showWizardPanel: false,
      controlModule: undefined,
      showlistPropertyWindow: false,
      showTopTileWindow: false,
      showlistPanel: null,
      ShowTopTile: false,
      entityValue: props.entityValue,
      groupBySortType: props.schema.groupBySortType,
      tileEntityOption: props.tileEntityOption,
      editId: props.editId,
      plainCardProps: {
        onRenderPlainCard: this.onRenderPlainCard
      },
      commandBarItems: props.schema.commandBarItems
        ? props.schema.commandBarItems
        : [],
      columns: props.schema.columns
        ? props.schema.columns
        : [
          {
            name: "Name",
            fieldName: "",
            minWidth: 100
          }
        ],
      getDistinctData: props.schema.getDistinctData,
      items: props.allStates[props.schema.entityValue] || [],
      groups: [],
      formId: -1,
      isFinalSave: false,
      saveData: this.saveData,
      panelType: 4,
      isExport: false,
      showExportDialog: false,
      exportElement: null,
      defaultExportValue: "1",
      exportFormatValue: -1,
      control: null,
      controlSchema: null,
      exportIndex: 0,
      exportSelectedItem: null
    };
  }

  getSelectionDetails = () => {
    if (this.props.successMessage.isSuccess || this.props.successMessage.panel)
      this.props.setSuccessMessage(false, null, false);
    var selectionIndex = this.selection.getSelectedIndices()[0];

    this.props.tableDataForm(
      "selectionIndex",
      { selectionIndex: selectionIndex },
      "",
      "updateTableEntity"
    );
    this.props.schema.updatedItems(
      this.selection.getSelection(),
      this.props.schema.trackSelectionEntity,
      this.props.schema.columns
    );
  };

  componentWillMount() {
    this.defineControlModule();
  }
  hideItemPanel = () => {
    this.setState({
      addItemPanel: false
    });
  };

  deleteItems = item => {
    const { items } = this.state;
    let itemData = filter(items, c => {
      return c.key !== item.key;
    });
    this.setState({
      items: itemData
    });
  };

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.schema.entityValue !== this.props.schema.entityValue) {
      this.setState({
        schema: nextProps.schema,
        entityValue: nextProps.schema.entityValue,
        commandBarItems: nextProps.schema.commandBarItems || [],
        columns: nextProps.schema.columns || [
          {
            name: "Name",
            fieldName: "",
            minWidth: 100
          }
        ],
        items: this.props.allStates[nextProps.schema.entityValue] || []
      });
    }
    this.filterCommandBars();
  }
  filterCommandBars = () => {
    this.filterSet = false;
    this.newCommandBarItems = [];
    this.getFilteredCommandBarItems();
  }

  getFilteredCommandBarItems = () => {
    if (this.state.schema.commandBarItems !== null) {
      for (var i = 0; i < this.state.schema.commandBarItems?.length; i++) {
        let commandBar = this.state.schema.commandBarItems[i];
        if (
          this.selection &&
          (this.selection._selectedItems !== null ||
            !isUndefined(this.selection.getSelection()[0]))
        ) {
          this.filterSet1 = false;
          this.filterSet2 = false;
          // let selectedItems = this.selection._selectedItems[0]
          //   ? this.selection._selectedItems[0]
          //   : this.selection.getSelection()[0];
          forEach(this.selection._selectedItems[0], (value, index, arr) => {
            if (
              commandBar.filterRuleSet &&
              commandBar.filterRuleSet.condition === "and"
            ) {
              if (
                commandBar.filterRuleSet &&
                some(commandBar.filterRuleSet.rules, item => item.field === index)
              ) {
                commandBar.filterRuleSet &&
                  commandBar.filterRuleSet.rules &&
                  some(commandBar.filterRuleSet.rules, (item, i) => {
                    if (item.field === index) {
                      this.counter = i;
                    }
                  });
                if (
                  commandBar.filterRuleSet &&
                  commandBar.filterRuleSet.rules[this.counter].operator ===
                  "equal"
                ) {
                  if (
                    commandBar.filterRuleSet &&
                    value?.toLowerCase() ===
                    commandBar.filterRuleSet.rules[
                      this.counter
                    ].value?.toLowerCase()
                  ) {
                    this.filterSet1 = true;
                  } else {
                    this.filterSet2 = true;
                  }
                }
                if (
                  commandBar.filterRuleSet &&
                  commandBar.filterRuleSet.rules &&
                  commandBar.filterRuleSet.rules[this.counter].operator ===
                  "notequal"
                ) {
                  if (
                    commandBar.filterRuleSet &&
                    value.toLowerCase() ===
                    commandBar.filterRuleSet.rules[
                      this.counter
                    ].value.toLowerCase()
                  ) {
                    this.filterSet1 = true;
                    this.filterSet2 = true;
                  } else {
                    this.filterSet2 = this.filterSet1
                      ? this.filterSet2
                        ? false
                        : true
                      : false;
                    this.filterSet1 = this.filterSet1 ? false : true;
                  }
                }
                if (
                  commandBar?.filterRuleSet &&
                  commandBar?.filterRuleSet.rules[this.counter]?.operator ===
                  "in"
                ) {
                  if (
                    commandBar.filterRuleSet?.rules[this.counter]?.value?.split(",")?.includes(value)
                  ) {
                    this.filterSet1 = true;
                  } else {
                    this.filterSet1 = false;
                    this.filterSet2 = false;
                  }
                }
                if (
                  commandBar?.filterRuleSet &&
                  commandBar?.filterRuleSet?.rules[this.counter]?.operator ===
                  "notin"
                ) {
                  if (
                    !commandBar.filterRuleSet?.rules[this.counter]?.value?.split(",")?.includes(value)
                  ) {
                    this.filterSet1 = true;
                  } else {
                    this.filterSet1 = false;
                    this.filterSet2 = false;
                  }
                }
              }
              this.filterSet = this.filterSet1 && !this.filterSet2;
              if (this.filterSet) {
                if (this.newCommandBarItems.length < 1) {
                  this.newCommandBarItems.push(commandBar);
                } else if (
                  some(this.newCommandBarItems,
                    item => item.key === commandBar.key
                  )
                ) {
                  some(this.newCommandBarItems, (item, index) => {
                    if (item.key === commandBar.key) {
                      this.index = index;
                    }
                  });
                  if (isUndefined(this.index)) {
                    this.newCommandBarItems.push(commandBar);
                  }
                } else {
                  this.newCommandBarItems.push(commandBar);
                }
              }
              if (this.filterSet2) {
                if (
                  some(this.newCommandBarItems,
                    item => item.key === commandBar.key
                  )
                ) {
                  some(this.newCommandBarItems, (item, index) => {
                    if (item.key === commandBar.key) {
                      this.index = index;
                    }
                  });
                  this.newCommandBarItems.splice(this.index, 1);
                }
              }
            } else {
              if (
                commandBar.filterRuleSet &&
                commandBar.filterRuleSet.rules &&
                some(commandBar.filterRuleSet.rules, item => item.field === index)
              ) {
                commandBar.filterRuleSet &&
                  some(commandBar.filterRuleSet.rules, (item, i) => {
                    if (item.field === index) {
                      this.counter = i;
                    }
                  });
                if (
                  commandBar.filterRuleSet &&
                  commandBar.filterRuleSet.rules[this.counter].operator ===
                  "equal"
                ) {
                  if (
                    commandBar.filterRuleSet &&
                    value.toLowerCase() ===
                    commandBar.filterRuleSet.rules[
                      this.counter
                    ].value.toLowerCase()
                  ) {
                    this.filterSet1 = true;
                  } else {
                    this.filterSet2 = false;
                  }
                }
                if (
                  commandBar.filterRuleSet &&
                  commandBar.filterRuleSet.rules[this.counter].operator ===
                  "notequal"
                ) {
                  if (
                    commandBar.filterRuleSet &&
                    value.toLowerCase() ===
                    commandBar.filterRuleSet.rules[
                      this.counter
                    ].value.toLowerCase()
                  ) {
                    this.filterSet1 = false;
                    this.filterSet2 = false;
                  } else {
                    this.filterSet1 = true;
                    this.filterSet2 = true;
                  }
                }
              }
              this.filterSet = this.filterSet1 || this.filterSet2;
              if (this.filterSet) {
                if (this.newCommandBarItems.length < 1) {
                  this.newCommandBarItems.push(commandBar);
                } else if (
                  some(!this.newCommandBarItems,
                    item => item.key === commandBar.key
                  )
                ) {
                  this.newCommandBarItems.push(commandBar);
                }
              }
            }
          });
        }
      }
    }
  }
  componentDidMount() {
    if (this.state.schema.componentName !== "TopTilesComponent")
      this.commandBarItems = cloneDeep(this.state.schema.commandBarItems);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.componentName !== this.props.componentName) {
      this.setState({
        componentName: this.props.componentName
      });
      this.defineControlModule();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.currentOperation &&
      nextProps.currentOperation.status === "done"
    ) {
      this.saveData();
    }
  }

  defineControlModule = async () => {
    let { schema } = this.props;
    if (isUndefined(schema.componentName) || schema.componentName === "") {
      this.setState({
        controlModule: undefined,
        controlModuleName: ""
      });
    }
    let controlModule = null;
    if (
      schema.componentName &&
      schema.componentName !== null &&
      schema.componentName !== "TableListComponent" &&
      schema.componentName !== "TableSearchComponent" &&
      schema.componentName !== "TableAddAndSearchComponent" &&
      schema.componentName !== "TopTilesComponent"
    ) {
      controlModule = officeUIModule[schema.componentName];
      this.setState({
        controlModule: controlModule,
        controlModuleName: schema.componentName
      });
    } else if (schema.componentName === "TopTilesComponent") {
      if (!isUndefined(schema.componentName)) {
        let mod;
        if (schema.componentName === "TopTilesComponent")
          mod = await import(`./TopTilesComponent/TopTilesComponent`);
        controlModule = await mod.default;
        this.setState({
          controlModule: controlModule,
          controlModuleName: schema.componentName
        });
      }
    }
    else {
      if (!isUndefined(schema.componentName)) {
        const mod = await import(
          `../../../../components/shared/${schema.componentName}`
        );
        controlModule = await mod.default;
        this.setState({
          controlModule: controlModule,
          controlModuleName: schema.componentName
        });
      }
    }
  };

  setSchemaData = (key, value) => {
    let { schema } = this.props;
    if ("uniqueId" !== key) {
      schema[key] = value;
    }
    schema.hasChanged = true;
    this.setState({
      schema: schema,
      controlSchema: schema
    });
  };

  setStateData = (key, value) => {
    this.setState({
      [key]: value
    });
  };

  hidePanel = event => {
    if (!event) {
      return;
    }
    this.setState((prevState, props) => ({
      showlistPropertyWindow: !prevState.showlistPropertyWindow,
      showTopTileWindow: !prevState.showTopTileWindow,
      showlistPanel: !prevState.showlistPanel,
      ShowTopTile: !prevState.ShowTopTile
    }));
  };

  setPropertyWindow = e => {
    if (this.props.schema.componentName === "TopTilesComponent") {
      this.props.tilePanelForm()
    } else {
      this.setState((prevState, props) => ({
        showlistPropertyWindow: !prevState.showlistPropertyWindow,
        showlistPanel: !prevState.showlistPanel
      }));
    }

  };

  onChangeEvent = (e, options, index, name, componentName) => {
    let key = "",
      value = "";
    if (componentName === "Checkbox") {
      key = name;
      value = e.target.name;
    } else if (componentName === "Dropdown") {
      key = name;
      value = options.key;
    } else if (componentName === "Toggle") {
      key = name;
      value = options;
    } else {
      key = e.target.name;
      value = e.target.value;
    }
    this.setState({
      [key]: value
    })
    // ,
    // () => {
    //   if (this.props.setData) {
    //     this.props.setData(key, value);
    //   }
    // }
  }

  closePanel = (e, type) => {
    if (!e) return;
    this.selection.setAllSelected(false);
    if (!this.props.currentTabOperation.isTab) {
      this.props.updateTabIndex(null, null, true);
    }
    let panelActionArray = cloneDeep(this.props.panelActionArray)
    panelActionArray.pop();
    let validationArray = cloneDeep(this.props.validationArray);
    validationArray.shift();
    this.props.tableDataForm(
      "TABLEENTITY",
      { TABLEENTITY: {} },
      "",
      "updateTableEntity"
    );
    if (this.props.currentOperation.operationType === "viewTable")
      this.props.tableDataForm(
        "VIEWPARENTENTITY",
        { VIEWPARENTENTITY: {} },
        "",
        "updateTableEntity"
      );
    let PARENTENTITY = this.props.tableDataInput.PARENTENTITY;
    if (this.state.isFinalSave) {
      setTimeout(() => {
        this.props.clearDataForm(
          ["REQUESTS", "REQUEST_AREAS", "REQUEST_CARDS"],
          "clearSaveDataForEntity"
        );
      }, 100)

      if (this.props?.tableDataInput?.VW_LOCATION_ACCESSAREAS_SS) {
        this.props.tableDataForm(
          "VW_LOCATION_ACCESSAREAS_SS",
          [],
          "deleteTableEntity"
        );
      }
      else {
        this.props.tableDataForm(
          "VW_LOCATION_ACCESSAREAS",
          [],
          "deleteTableEntity"
        );
      }
      this.props.setUtilData("newAddMandatory", []);
    }
    if (
      PARENTENTITY &&
      this.props.currentOperation.operationType !== "historyTable" &&
      this.props.currentOperation.operationType !== "viewTable" &&
      //!this.props.currentRequestNav?.requestFormId &&
      (PARENTENTITY.KEY === this.state.schema.entityValue ||
        (this.state.schema.entityTypeValue === "view" &&
          this.state.schema.entityDestination === PARENTENTITY.KEY))
    ) {
      this.props.setSaveCurrentOperation();
      if (type !== "localSave") {
        this.props.clearDataForm();
      }
      if (this.props.currentRequestNav?.requestFormId !== "") {
        this.props.onSetWizardComponent({
          currentRequestNav: {},
          headerInfo: {},
          panelActionArray: panelActionArray,
          validationArray: validationArray
        });
      }
      setTimeout(() => {
        this.props.onResetAllState();
      }, 100)
    } else {
      if (
        this.props.currentOperation
        && this.props.currentOperation.parentOperation === "historyTable"
      ) {
        this.props.setSaveCurrentOperation("", "");
      } else {
        this.props.setSaveCurrentOperation(this.props.currentOperation.parentOperation, "");
      }

      let innerChildValidations = [],
        validations = [];
      if (
        this.props.childFormValidation.innerChildValidations &&
        this.props.childFormValidation.innerChildValidations.length > 0
      ) {
        validations = cloneDeep(
          this.props.childFormValidation.innerChildValidations
        );
      }

      this.props.onSetWizardComponent({
        childFormValidation: {
          validations: validations,
          innerChildValidations: innerChildValidations,
          isValid: true
        },
        headerInfo: {},
        panelActionArray: panelActionArray,
        validationArray: validationArray
      });
      if (
        this.props.currentOperation.operationType !== "historyTable" &&
        this.props.currentOperation.operationType !== "viewTable" &&
        !this.state.isFinalSave
      ) {
        this.props.clearDataForm(this.state.schema.entityValue, type);
      }
      let dropdownValues = Object.values(this.props.dropdownSelectionInput);
      if (
        JSON.stringify(dropdownValues[0]) ===
        JSON.stringify(dropdownValues[1]) &&
        type !== "localSave" &&
        this.state.isFinalSave
      ) {
        Object.keys(this.props.dropdownSelectionInput).forEach(x => {
          if (x.split("**")[1] === "DESTINATION") {
            this.props.onResetMultiselect(x.split("**")[0]);
            this.props.onResetMultiselect(x);
          } else {
            this.props.onResetMultiselect(x);
          }
        });
      }
      if (
        this.state.schema.entityTypeValue === "view" &&
        this.props.currentOperation.operationType !== "historyTable" &&
        this.props.currentOperation.operationType !== "viewTable" &&
        !this.state.isFinalSave &&
        this.state.schema.entityDestination !== "REQUEST_AREAS"
      ) {
        this.props.clearDataForm(this.state.schema.entityDestination, type);
      }
      //this.clearValidations();
    }
    if (this.props.location.hash) {
      this.props.history.push(this.props.location.pathname);
      this.props.setUtilData("isParentPanelOpened", false);
      this.props.setUtilData("updateTableData", true);
      this.props.tableDataForm(
        "PARENTENTITY",
        { PARENTENTITY: null },
        "",
        "updateTableEntity"
      );
    } else if (this.props.utilityData?.panelData) {
      this.props.setUtilData("panelData", null);
    }
    // else if(this.props.tableDataInput.PARENTENTITY && this.props.currentOperation.parentOperation===""||this.props.currentOperation.parentOperation==="editTable"){
    //   this.props.tableDataForm(
    //     "PARENTENTITY",
    //     { PARENTENTITY: null },
    //     "",
    //     "updateTableEntity"
    //   );
    // }

    if (!this.state.isFinalSave) {
      this.clearValidations();
    }
    this.setState({
      showPanel: false,
      showWizardPanel: false
    });
    this.props.setConditionName(null, null);
    let element = document.getElementsByClassName("header-sticky");
    if (element && element[0]) {
      element[0].classList.remove("header-sticky");
    }
    this.props.setSuccessMessage(false, null, false, false);
  };

  saveData = async e => {
    if (
      this.props.currentOperation &&
      this.props.currentOperation.status === "done"
    ) {
      this.props.setSaveCurrentOperation("", "");
    }
    let input = {};
    let PARENTENTITY = this.props.tableDataInput.PARENTENTITY;
    let finalObjectSave = cloneDeep(this.props.saveDataInput);
    let updateDataList = null, updateDataListCopy = null;
    if ((this.props.currentOperation.operationType === "addTable" || this.props.currentOperation.operationType === "editTable") && this.props.schema.entityDestination === "IDENTITY_DELEGATES" && this.props.schema.entityValue === "VW_IDENTITY_DELEGATES") {
      var newTasks = [], newVFID, newStartDate, newEndDate, tasks, id, startDate, endDate, tasksToBeSaved = [], savedTaskList = [], tasksToBeRemoved = [];
      newTasks = finalObjectSave[this.props.schema.entityDestination].TASKTYPE.split(",");
      newStartDate = new Date(finalObjectSave[this.props.schema.entityDestination].STARTDATE).toDateString();
      newEndDate = new Date(finalObjectSave[this.props.schema.entityDestination].ENDDATE).toDateString();
      newVFID = finalObjectSave[this.props.schema.entityDestination].VFUUID;
      newTasks.forEach(delegate => {
        tasksToBeSaved = tasksToBeSaved.concat({ TASKS: delegate, STARTDATE: newStartDate, ENDDATE: newEndDate, ID: newVFID });
      });
      let currnetDelegates = filter(this.props.tableDataInput[this.props.schema.entityValue], (delegate) => {
        return (delegate.STATUS === "Pending" || delegate.STATUS === "Active");
      });
      currnetDelegates.forEach(delegate => {
        tasks = delegate.TASKTYPE;
        startDate = new Date(delegate.STARTDATE).toDateString();
        endDate = new Date(delegate.ENDDATE).toDateString();
        id = delegate.VFUUID;
        savedTaskList = savedTaskList.concat({ TASKS: tasks, STARTDATE: startDate, ENDDATE: endDate, ID: id });
      });
      tasksToBeSaved.forEach(ele => {
        savedTaskList.forEach(item => {
          if (new Date(ele.STARTDATE).getTime() > new Date(item.ENDDATE).getTime() || new Date(ele.ENDDATE).getTime() < new Date(item.STARTDATE).getTime()) {

          } else {
            if (ele.TASKS === item.TASKS) {
              if (!tasksToBeRemoved.includes(ele.TASKS)) {
                if (this.props.currentOperation.operationType === "addTable" || (this.props.currentOperation.operationType === "editTable" && ele.ID !== item.ID)) {
                  tasksToBeRemoved.push(ele.TASKS);
                }
              }
            }
          }
        })
      });
      if (tasksToBeRemoved.length) {
        this.isDelegateError = true;
        this.props.setSuccessMessage(
          false,
          `${tasksToBeRemoved} has already been delegated.`,
          true,
          true
        );
      }
    }
    if (!this.isDelegateError) {
      if (this.props.successMessage.isSuccess || this.props.successMessage.panel) {
        this.props.setSuccessMessage(false, null, false);
      }
      if (this.state.isFinalSave === true) {
        if (
          !isUndefined(finalObjectSave["IDENTITY_PHOTOS"]) &&
          isUndefined(finalObjectSave["IDENTITY_PHOTOS"].ISMODIFIED)
        ) {
          delete finalObjectSave["IDENTITY_PHOTOS"];
        }
        if (
          (finalObjectSave["REQUESTS"] &&
            finalObjectSave["REQUEST_AREAS"] &&
            PARENTENTITY.VALUE === "" &&
            PARENTENTITY.KEY === "IDENTITIES") ||
          (this.props.formJSON?.applyContext === 1 && PARENTENTITY.VALUE === "")
        ) {
          delete PARENTENTITY.VALUE;
          PARENTENTITY.APPLYCONTEXT = true;
        }
        if (
          this.props.currentRequestNav &&
          Object.keys(this.props.currentRequestNav).length > 0
        ) {
          if (finalObjectSave["REQUESTS"]) {
            finalObjectSave["REQUESTS"][
              "REQUESTTYPE"
            ] = this.props.currentRequestNav.requestKey;
          }
        }
        input.PARENTENTITY = PARENTENTITY;
        Object.keys(this.props.saveDataInput).forEach(x => {
          if (!isUndefined(this.props.tableDataInput[x])) {
            finalObjectSave[x] = filter(this.props.tableDataInput[x], {
              isModified: true
            });
          }
          if (x.indexOf("VW_") !== -1) delete finalObjectSave[x];
        });
        delete finalObjectSave[""];

        let saveDataInput = cloneDeep(this.props.saveDataInput);
        let currentSchema = Object.assign({}, this.state.schema);

        if (this.props.currentOperation.operationType === "addTable") {
          if (currentSchema.entityDestination !== null &&
            !isUndefined(saveDataInput[currentSchema.entityDestination])
          ) {
            updateDataList = saveDataInput[currentSchema.entityDestination];
            updateDataList["isModified"] = true;
            if (isArray(finalObjectSave[currentSchema.entityDestination])) {
              finalObjectSave[currentSchema.entityDestination].push(updateDataList);
            } else {
              finalObjectSave[currentSchema.entityDestination] = updateDataList;
            }
          } else if (saveDataInput[currentSchema.entityValue]) {
            updateDataList = saveDataInput[currentSchema.entityValue];
            updateDataList["isModified"] = true;
            if (isArray(finalObjectSave[currentSchema.entityValue])) {
              finalObjectSave[currentSchema.entityValue].push(updateDataList);
            } else {
              finalObjectSave[currentSchema.entityValue] = updateDataList;
            }
          }
        } else if (this.props.currentOperation.operationType === "editTable" && currentSchema.entityDestination !== "EVENTS") {
          if (currentSchema.entityDestination !== null &&
            !isUndefined(saveDataInput[currentSchema.entityDestination])
          ) {
            updateDataList = saveDataInput[currentSchema.entityDestination];
            updateDataList.MODIFIEDON = new Date().toJSON();
            updateDataList["isModified"] = true;
            if (isArray(finalObjectSave[currentSchema.entityDestination])) {
              if (finalObjectSave[currentSchema.entityDestination].length > this.props.tableDataInput.selectionIndex)
                finalObjectSave[currentSchema.entityDestination][this.props.tableDataInput.selectionIndex] = updateDataList;
              else
                finalObjectSave[currentSchema.entityDestination].push(updateDataList);
            } else {
              finalObjectSave[currentSchema.entityDestination] = updateDataList;
            }
          } else if (saveDataInput[currentSchema.entityValue]) {
            updateDataList = saveDataInput[currentSchema.entityValue]
            updateDataList["isModified"] = true;
            if (updateDataList.ACTIVATIONDATE)
              updateDataList.ACTIVATIONDATE = updateDataList.ACTIVATIONDATE.toJSON();
            if (updateDataList.DEACTIVATIONDATE)
              updateDataList.DEACTIVATIONDATE = updateDataList.DEACTIVATIONDATE.toJSON();
            if (updateDataList.STARTDATE)
              updateDataList.STARTDATE = updateDataList.STARTDATE.toJSON();
            if (updateDataList.ENDDATE)
              updateDataList.ENDDATE = updateDataList.ENDDATE.toJSON();
            if (isArray(finalObjectSave[currentSchema.entityValue])) {
              if (finalObjectSave[currentSchema.entityValue][this.props.tableDataInput.selectionIndex])
                finalObjectSave[currentSchema.entityValue][this.props.tableDataInput.selectionIndex] = updateDataList;
              else
                finalObjectSave[currentSchema.entityValue].push(updateDataList)
            } else {
              finalObjectSave[currentSchema.entityValue] = updateDataList;
            }
          }
        }

        // if (saveDataInput["ENTITYFIELDS"]) {
        //   finalObjectSave["ENTITYFIELDS"] = saveDataInput["ENTITYFIELDS"]
        // }
        // if (saveDataInput["ENTITYRELATIONSHIPS"]) {
        //   finalObjectSave["ENTITYRELATIONSHIPS"] = saveDataInput["ENTITYRELATIONSHIPS"]
        // }

        //Temp code for delegates add
        if (finalObjectSave["IDENTITY_DELEGATES"]) {
          if (isUndefined(finalObjectSave["IDENTITY_DELEGATES"].length) || finalObjectSave["IDENTITY_DELEGATES"].length === 1) {
            updateDataListCopy = finalObjectSave["IDENTITY_DELEGATES"][0] ? finalObjectSave["IDENTITY_DELEGATES"][0] : finalObjectSave["IDENTITY_DELEGATES"]
            if (
              isUndefined(updateDataListCopy.STATUS) ||
              (!isUndefined(updateDataListCopy.STATUS) &&
                updateDataListCopy.STATUS === "")
            ) {
              updateDataListCopy.STATUS = "Pending";
            }
            updateDataList = [];
            let delegateTypes = updateDataListCopy.TASKTYPE.split(",");
            delegateTypes.forEach((type, i) => {
              let delegate = cloneDeep(updateDataListCopy);
              delegate.TASKTYPE = delegateTypes[i];
              updateDataList.push(delegate);
            });
            finalObjectSave["IDENTITY_DELEGATES"] = updateDataList;
          } else {
            finalObjectSave["IDENTITY_DELEGATES"].forEach(delegate => {
              if (
                isUndefined(delegate.IDENTITYUUID) ||
                (!isUndefined(delegate.IDENTITYUUID) &&
                  delegate.IDENTITYUUID === "")
              ) {
                delegate.IDENTITYUUID = finalObjectSave["IDENTITIES"].VFUUID;
              }
              if (
                isUndefined(delegate.STATUS) ||
                (!isUndefined(delegate.STATUS) && delegate.STATUS === "")
              ) {
                delegate.STATUS = "Pending";
              }
            });
          }
        }
        if (!this.checkDateValidation())
          return false;
        /**Temp Card Format validation */
        if (!this.checkCardDataValidation())
          return false;
        let result = await this.checkDuplicateCard();
        if (!result)
          return false;
        if (
          this.state.schema.entityValue === "VW_ENTITIES" &&
          this.state.schema.entityDestination === "ENTITIES"
        ) {
          finalObjectSave[this.state.schema.entityDestination].ENTITYTYPE =
            "Table";
        }
        // input.DATA = JSON.stringify(finalObjectSave);
        if ((finalObjectSave["BULKACTIONS"] && finalObjectSave["BULKACTION_IDENTITIES"])
          || (finalObjectSave["EVENTS"])) {
          input.DATA = JSON.stringify(finalObjectSave)
        }
        else if (finalObjectSave[currentSchema.entityDestination]) {
          input.DATA = JSON.stringify({ [currentSchema.entityDestination]: finalObjectSave[currentSchema.entityDestination] });
        } else if (finalObjectSave[currentSchema.entityValue]) {
          input.DATA = JSON.stringify({ [currentSchema.entityValue]: finalObjectSave[currentSchema.entityValue] });
        }
        /** Exception handling for REQUESTS */
        if (finalObjectSave["REQUESTS"] && finalObjectSave["REQUEST_AREAS"]) {
          let rerObj = finalObjectSave["REQUESTS"];

          if (!rerObj["REQUESTEDFOR"]) {
            if (this.props.formJSON?.applyContext === 1) {
              if (saveDataInput["VW_MYPROFILE_IDENTITYDETAILS"] && saveDataInput["VW_MYPROFILE_IDENTITYDETAILS"].VFUUID) {
                rerObj["REQUESTEDFOR"] = saveDataInput["VW_MYPROFILE_IDENTITYDETAILS"].VFUUID;
              }
              else {
                PARENTENTITY.APPLYCONTEXT = true;
              }
            }
            else {
              rerObj["REQUESTEDFOR"] = saveDataInput["IDENTITIES"].VFUUID;
            }
          }

          input.DATA = JSON.stringify({
            "REQUESTS": rerObj,
            "REQUEST_AREAS": finalObjectSave["REQUEST_AREAS"]
          });
        }
        else if (finalObjectSave["REQUESTS"] && finalObjectSave["REQUEST_CARDS"]) {
          let finalRequestcard;
          let requestObj = finalObjectSave["REQUESTS"];
          finalRequestcard = finalObjectSave["REQUEST_CARDS"];
          let tableData = cloneDeep(this.props.tableDataInput);
          let selIndex = tableData["selectionIndex"];
          let identityCards;
          let IdentityCardObj = {
            STATUS: null,
            VFUUID: null
          };
          if (isUndefined(finalObjectSave["IDENTITY_CARDS"]) || finalObjectSave["IDENTITY_CARDS"].length === 0) {
            identityCards = tableData["IDENTITY_CARDS"][selIndex]
          }
          else {
            identityCards = finalObjectSave["IDENTITY_CARDS"]
          }
          if (finalRequestcard) {
            let IdentityCard = isUndefined(identityCards.length) ? identityCards : identityCards[0];
            finalRequestcard["CARDUUID"] = IdentityCard.VFUUID;
            finalRequestcard["CARDCODE"] = IdentityCard.CARDCODE;
            finalRequestcard["CARDNUMBER"] = IdentityCard.CARDNUMBER;
            finalRequestcard["CARDTYPE"] = IdentityCard.CARDTYPE;
            finalRequestcard["FORMATID"] = IdentityCard.FORMATID;
            finalRequestcard["ACTIVATIONDATE"] = IdentityCard.ACTIVATIONDATE;
            finalRequestcard["DEACTIVATIONDATE"] = IdentityCard.DEACTIVATIONDATE;
            finalRequestcard["BADGETEMPLATE"] = IdentityCard.BADGETEMPLATE;
            requestObj["REQUESTEDFOR"] = IdentityCard.IDENTITYUUID;
            requestObj["COMMENTS"] = finalRequestcard.INCIDENTDETAILS;
            requestObj["EXPEDITE"] = finalRequestcard.EXPEDITE ? finalRequestcard.EXPEDITE : "0";

            IdentityCardObj["STATUS"] = finalRequestcard["STATUS"] === "Damaged" ? "DamagedUsable" : finalRequestcard["STATUS"];
            IdentityCardObj["VFUUID"] = IdentityCard.VFUUID;
          }

          input.DATA = JSON.stringify({
            "REQUESTS": requestObj,
            "REQUEST_CARDS": finalRequestcard ? finalRequestcard : finalObjectSave["REQUEST_CARDS"],
            "IDENTITY_CARDS": IdentityCardObj
          });
        }
        if (!input.PARENTENTITY || !input.PARENTENTITY.KEY) {
          delete input.PARENTENTITY;
        }
        this.setState({ isBtnDisabled: true });
        ApolloClientService.getData("query", API.saveData, input).then(res => {
          if (res.errors && res.errors.length) {
            if (res.errors[0].statusCode === 405) {
              this.setState({
                showAlertBox: true,
                displayType: "Error",
                title: this.trans("Alert"),
                subText: this.trans("dataBackgroundUpdated"),
                saveBtnText: this.trans("Ok")
              })
            }
          } else {
            this.closePanel(e);
            this.props.setUtilData("updateTopTiles", true);
            this.props.setConditionName(null, null);
            if (
              (PARENTENTITY &&
                this.props.currentOperation.operationType !== "historyTable" &&
                this.props.currentOperation.operationType !== "viewTable" &&
                (PARENTENTITY.KEY === this.state.schema.entityValue ||
                  (this.state.schema.entityTypeValue === "view" &&
                    this.state.schema.entityDestination === PARENTENTITY.KEY))) ||
              this.props.currentOperation.parentOperation === ""
            ) {
              this.props.setSuccessMessage(
                true,
                this.trans("dataSavedSuccess")
              );
            } else {
              this.props.setSuccessMessage(
                false,
                this.trans("dataSavedSuccess"), true
              );
            }
          }
          this.setState({ isBtnDisabled: false });
          this.props.onSetWizardComponent({ forceRefreshList: true });
        });
      } else {
        updateDataList = cloneDeep(
          this.props.saveDataInput[this.props.schema.entityValue]
        );
        if (
          this.state.schema.entityDestination !== null &&
          !isUndefined(
            this.props.saveDataInput[this.state.schema.entityDestination]
          )
        ) {
          updateDataList = cloneDeep(
            this.props.saveDataInput[this.state.schema.entityDestination]
          );
        }
        if (this.props.currentOperation.operationType === "addTable") {
          if (
            !isUndefined(
              this.props.tableDataInput[
              `${this.props.schema.entityValue}_UniqueArray`
              ]
            )
          ) {
            var uniqueProperties = filter(
              this.props.tableDataInput[
              `${this.props.schema.entityValue}_UniqueArray`
              ],
              function (o) {
                return o.isUnique;
              }
            ).map(x => x.fieldName);
            if (uniqueProperties && uniqueProperties.length > 0) {
              let uniquePropertyObj = {};
              this.multipleSelect = false;
              Object.keys(this.props.dropdownSelectionInput).forEach(x => {
                if (x.includes("**")) {
                  this.multipleSelect = true;
                }
              });
              if (this.multipleSelect) {
                updateDataList = updateDataList
                  ? updateDataList
                  : this.props.tableDataInput[this.props.schema.entityValue];
              }
              if (updateDataList) {
                uniqueProperties.map(
                  value => (uniquePropertyObj[value] = updateDataList[value])
                );
              }

              var isAdded = find(
                this.props.tableDataInput[this.props.schema.entityValue],
                uniquePropertyObj
              );
              if (!isAdded && !this.multipleSelect) {
                this.props.tableDataForm(
                  this.props.schema.entityValue,
                  updateDataList,
                  "addTableSave"
                );
              } else if (!isAdded && this.multipleSelect) {
                this.props.tableDataForm(
                  this.props.schema.entityValue,
                  updateDataList,
                  "multiselectTableSave",
                  ""
                );
              } else {
                alert("Duplicate Data");
              }
            } else {
              if (
                this.state.schema.entityDestination !== null &&
                this.state.schema.entityDestination !==
                this.state.schema.entityValue
              ) {
                if (
                  this.state.schema.entityDestination === "IDENTITY_DELEGATES"
                ) {
                  updateDataListCopy = updateDataList;
                  updateDataList = [];
                  let delegateTypes = updateDataListCopy.TASKTYPE.split(",");
                  let delegateTypes_Text = updateDataListCopy.TASKTYPE_DISPLAYTEXT.split(
                    ","
                  );
                  delegateTypes.forEach((type, i) => {
                    let delegate = updateDataListCopy;
                    delegate.TASKTYPE = delegateTypes[i];
                    delegate.TASKTYPE_DISPLAYTEXT = delegateTypes_Text[i];
                    delegate.isModified = true;
                    updateDataList.push(delegate);
                  });
                  let originalDelegates = cloneDeep(
                    this.props.tableDataInput[this.state.schema.entityValue]
                  );
                  updateDataList = updateDataList.concat(originalDelegates);
                }
                this.props.tableDataForm(
                  this.state.schema.entityDestination,
                  updateDataList,
                  "addTableSave"
                );
                this.props.tableDataForm(
                  this.state.schema.entityValue,
                  updateDataList,
                  "addTableSave"
                );
              } else {
                this.multipleSelect = false;
                Object.keys(this.props.dropdownSelectionInput).forEach(x => {
                  if (x.includes("**")) {
                    this.multipleSelect = true;
                  }
                });
                if (this.multipleSelect) {
                  updateDataList = updateDataList
                    ? updateDataList
                    : this.props.tableDataInput[this.props.schema.entityValue];
                  this.props.tableDataForm(
                    this.props.schema.entityValue,
                    updateDataList,
                    "multiselectTableSave",
                    ""
                  );
                } else {
                  this.props.tableDataForm(
                    this.props.schema.entityValue,
                    updateDataList,
                    "addTableSave",
                    ""
                  );
                }
                this.props.tableDataForm(
                  this.props.schema.entityValue,
                  updateDataList,
                  "addTableSave",
                  ""
                );
              }
            }
          } else {
            if (this.state.schema.entityDestination !== null) {
              this.props.tableDataForm(
                this.state.schema.entityDestination,
                updateDataList,
                "addTableSave"
              );
              this.props.tableDataForm(
                this.state.schema.entityValue,
                updateDataList,
                "addTableSave"
              );
            } else {
              this.multipleSelect = false;
              Object.keys(this.props.dropdownSelectionInput).forEach(x => {
                if (x.includes("**")) {
                  this.multipleSelect = true;
                }
              });
              if (this.multipleSelect) {
                updateDataList = updateDataList
                  ? updateDataList
                  : this.props.tableDataInput[this.props.schema.entityValue];
                this.props.tableDataForm(
                  this.props.schema.entityValue,
                  updateDataList,
                  "multiselectTableSave",
                  ""
                );
              } else {
                this.props.tableDataForm(
                  this.props.schema.entityValue,
                  updateDataList,
                  "addTableSave"
                );
              }
            }
          }
        } else if (this.props.currentOperation.operationType === "editTable") {
          if (this.state.schema.entityDestination !== null) {
            this.props.tableDataForm(
              this.state.schema.entityDestination,
              updateDataList,
              this.props.tableDataInput.selectionIndex,
              "updateToIndex"
            );
          }
          this.props.tableDataForm(
            this.props.schema.entityValue,
            updateDataList,
            this.props.tableDataInput.selectionIndex,
            "updateToIndex"
          );
        }
        if (this.props.tableDataInput.selectionIndex) {
          this.props.tableDataForm(
            "selectionIndex",
            { selectionIndex: undefined },
            "",
            "updateTableEntity"
          );
        }
        if (this.props.tableDataInput.selectedItemToEdit) {
          this.props.clearDataForm("selectedItemToEdit", "localsave");
        }
        this.clearValidations();
        this.closePanel(e, "localSave");
      }
    }
    // this.setState({ showAlertgBox: false }, () => {
    //   this.deleteSaveData(schema.entityDestination, selectedItems);
    // })
    this.isDelegateError = false;
    this.setState({ showAlertBox: false });
  };

  clearValidations = () => {
    // let newValidation = [];
    // let totalValidations = cloneDeep(this.props.totalTabValidations);
    // let isValidAll = true;
    // if (totalValidations.validations && isArray(totalValidations.validations)) {
    //   forEach(totalValidations.validations, x => {
    //     if (
    //       (this.state.schema.entityTypeValue === "table" &&
    //         x.entity !== this.state.schema.entityValue) ||
    //       (this.state.schema.entityTypeValue === "view" &&
    //         x.entity !== this.state.schema.entityDestination)
    //       // x.entity !== this.state.schema.entityValue
    //     ) {
    //       if (x.validation) {
    //         if (!x.validation.isValid) {
    //           isValidAll = false;
    //         }
    //       }
    //       let isAccordian = find(this.props.accordianDetails, { formId: x.formId });
    //       if (!isAccordian && x.formId !== this.props.currentTabOperation.currentTab && x?.formId && !Object.keys(x?.formId))
    //         newValidation.push(x);
    //     }
    //   });
    // }
    // totalValidations.validations = cloneDeep(newValidation);
    // totalValidations.isValid = isValidAll;
    if (
      this.props.utilityData
      && this.props.utilityData.addMandatory
      && this.props.utilityData.addMandatory.length > 0
    ) {
      let addMandatory = cloneDeep(this.props.utilityData.addMandatory);
      let newAddMandatory = [];
      forEach(addMandatory, x => {
        if (
          (this.state.schema.entityTypeValue === "table" &&
            x.entity !== this.state.schema.entityValue) ||
          (this.state.schema.entityTypeValue === "view" &&
            x.entity !== this.state.schema.entityDestination)
        ) {
          newAddMandatory.push(x);
        }
      });
      this.props.setUtilData("newAddMandatory", newAddMandatory);
    }
    // this.props.setTabValidations(totalValidations, null);
  };

  wizardCommandbarPanel = (form, selectedIndex) => {
    const panelType =
      form.panelSize !== null && form.panelSize !== ""
        ? Number(form.panelSize)
        : 4;
    const customTextInPixel =
      form.panelSize === "7" ? form.customTextInPixel : undefined;
    this.setState({
      showWizardPanel: true,
      formId: form.formId,
      isFinalSave: form.isFinalSave,
      action: form.componentAction,
      panelType,
      customTextInPixel,
      formName: form.name,
      commandbarTittle: form.commandbarTittle,
      commandbarDescription: form.commandbarDescription
    });
    // set the index of the selection since getSelectionDetails is triggering with undefined selectedindex when clicked on a link
    if (!isUndefined(selectedIndex) && selectedIndex > -1) {
      setTimeout(() => {
        this.selection.setIndexSelected(selectedIndex, true, true);
      });
    }
  };

  commandbarPanel = (form, selectedIndex) => {
    const panelType =
      form.panelSize !== null && form.panelSize !== ""
        ? Number(form.panelSize)
        : 4;
    const customTextInPixel =
      form.panelSize === "7" ? form.customTextInPixel : undefined;
    if (form.commandbarDisplayType === "panel" || form.commandbarDisplayType === null || form.commandbarDisplayType === "") {
      this.setState(
        {
          formId: form.formId,
          formName: form.name,
          isFinalSave: form.isFinalSave,
          panelType,
          customTextInPixel,
          commandbarTittle: form.commandbarTittle,
          commandbarDescription: form.commandbarDescription,
          commandbarActionType: form.componentAction,
          showPanel: !this.props.utilityData?.panelData?.openChildPanel ? true : false
        },
        () => {
          // set the index of the selection since getSelectionDetails is triggering with undefined selectedindex when clicked on a link
          if (!isUndefined(selectedIndex) && selectedIndex > -1) {
            setTimeout(() => {
              this.selection.setIndexSelected(selectedIndex, true, true);
            }, 100);
          }
        }
      );
    } else {
      this.setState(
        {
          formId: form.formId,
          showPanel: false,
          isFinalSave: form.isFinalSave,
          commandbarTittle: form.commandbarTittle,
          showAlertBox: true,
          closeBtnText: form.closeBtnText,
          saveBtnText: form.saveBtnText,
          type: this.displayType,
        })
    }
  };

  getData = (
    index,
    order,
    FILTERON,
    FILTER,
    PARENTENTITY,
    FIELDS,
    advSearchParams,
    forceRefresh = false,
    getDataOnly = false,
    orderByData = null
  ) => {
    this.props.tableDataForm(
      "selectionIndex",
      { selectionIndex: undefined },
      "",
      "updateTableEntity"
    );
    if (this.props.currentOperation.operationType === "" && this.props.currentOperation.parentOperation === "editTable") {
      this.props.setSaveCurrentOperation(
        this.props.currentOperation.parentOperation
      );
    }
    var PARAMETERS = advSearchParams
      ? advSearchParams
      : [];
    return new Promise((resolve, reject) => {
      if (
        this.props.formJSON &&
        (this.props.formJSON.componentType === "Chart") &&
        this.props.topTilesSelection &&
        isUndefined(this.props.topTilesSelection.tileIndex) &&
        !advSearchParams
      ) {
        resolve([]);
      } else {
        let filterData = {};
        if (FILTERON && FILTER) {
          filterData = {
            FILTERON,
            FILTER
          };
        }
        if (
          PARENTENTITY &&
          Object.keys(PARENTENTITY).length > 0 &&
          this.state.schema.entityValue !== PARENTENTITY.KEY
        ) {
          filterData.PARENTENTITY = PARENTENTITY;
        } else if (this.props.formJSON?.applyContext === 0) {
          if (this.props.schema?.entityDestination === "IDENTITY_AREAS" && this.props.schema?.entityValue === "VW_MYPROFILE_AREAS" && (this.props.saveDataInput?.VW_MYREQUESTFOR || this.props.saveDataInput?.VW_REQUESTFOR)) {
            let IdentityId = this.props?.saveDataInput?.REQUESTS?.REQUESTEDFOR;
            if (!IdentityId) {
              return resolve([]);
            }
            else {
              filterData.PARENTENTITY = {
                KEY: "IDENTITIES",
                VALUE: IdentityId
              };
            }
          } else {
            filterData.PARENTENTITY = this.props.tableDataInput.PARENTENTITY;
          }
        }
        var VIEWPARENTENTITY = this.props.tableDataInput.VIEWPARENTENTITY;
        if (
          VIEWPARENTENTITY &&
          Object.keys(VIEWPARENTENTITY).length > 0 &&
          this.state.schema.entityValue !== VIEWPARENTENTITY.KEY
        ) {
          filterData.PARENTENTITY = { KEY: VIEWPARENTENTITY.KEY, VALUE: VIEWPARENTENTITY.VALUE };
        }

        let columnData = cloneDeep(this.props.schema.columns);

        let isdefaultSorting = find(columnData, { defaultSorting: true });
        let isDesignerPage = false, path = this.props.history.location.pathname;
        if (path.includes('/studio/userinterface/canvas/forms/') || path.includes('/studio/userinterface/canvas/components/')) {
          isDesignerPage = true;
        }
        if (isdefaultSorting) {
          filterData.PAGINATION = {
            LIMIT: isDesignerPage ? 10 : 100,
            INDEX: index,
            ORDER:
              order?.length > 0 && !isEmpty(order[0])
                ? order
                : [[isdefaultSorting.fieldName,
                orderByData ? orderByData : isdefaultSorting?.columnSortType ? isdefaultSorting.columnSortType.toUpperCase() : "ASC"]]
          };
        } else {
          filterData.PAGINATION = {
            LIMIT: isDesignerPage ? 10 : 100,
            INDEX: index,
            ORDER: order?.length ? order : [[FILTERON[0], "ASC"]]
          };
        }

        if (!isdefaultSorting && this.props.currentOperation.operationType === "historyTable") {
          filterData.PAGINATION.ORDER = [["CHANGEDON", "DESC"]];
        }
        filterData.ENTITY = this.state.schema.entityValue;
        filterData.FIELDS = !isUndefined(FIELDS) ? FIELDS : FILTERON;
        if (!isUndefined(PARAMETERS)) filterData.PARAMETERS = PARAMETERS;
        if (
          this.props.topTilesSelection &&
          this.props.topTilesSelection.destinationEntity &&
          (this.props.topTilesSelection[filterData.ENTITY]) &&
          !isUndefined(this.props.topTilesSelection[filterData.ENTITY].tileIndex) &&
          !isNull(this.props.topTilesSelection[filterData.ENTITY].tileIndex) &&
          !advSearchParams &&
          this.props.currentOperation.operationType !== "historyTable"
        ) {
          let rulesSet = this.props.topTilesSelection.rules;
          if (this.props.topTilesSelection[filterData.ENTITY]) {
            rulesSet = this.props.topTilesSelection[filterData.ENTITY].rules
          }
          let condition = [];
          rulesSet &&
            rulesSet.forEach(rule => {
              let operator = rule.operator;
              let value = rule.value;
              if (rule.type === "date") {
                if (rule.operator === "before" || rule.operator === "after") {
                  operator = "BETWEEN";
                  if (rule.operator === "before") {
                    let priorDate = new Date().setDate(
                      new Date().getDate() - parseInt(rule.value)
                    );
                    let minDate = new Date(priorDate).toJSON();
                    let maxDate = new Date().toJSON();
                    value = minDate + "," + maxDate;
                  } else if (rule.operator === "after") {
                    let priorDate = new Date().setDate(
                      new Date().getDate() + parseInt(rule.value)
                    );
                    let maxDate = new Date(priorDate).toJSON();
                    let minDate = new Date().toJSON();
                    value = minDate + "," + maxDate;
                  }
                }
              }
              condition.push({
                KEY: rule.field,
                VALUE: value,
                OPERATION: operator.toUpperCase()
              });
            });
          filterData.PARAMETERS = condition;
        }
        if (!this.props.schema.isInfiniteScroll) {
          delete filterData.PAGINATION;
        }
        filterData.APPLYCONTEXT =
          this.props.formJSON?.applyContext === 1 ? true : false;
        if (this.props.location.hash && !this.props.utilityData?.isParentPanelOpened) {
          let hashValues = this.props.location.hash.split("#");
          filterData.PARAMETERS.push({
            KEY: "VFUUID",
            VALUE: hashValues[1],
            OPERATION: "EQUAL"
          })
        }
        filterData.FIELDS = map(columnData, x => x.fieldName);
        if (filterData.ENTITY) {
          filterData.GETONLYDATA = false;
          filterData.GETDISTINCT = this.props?.schema?.getDistinctData || false;
          if (this.props?.schema?.entityTypeValue === "procedure") {
            delete filterData.FIELDS;
            delete filterData.GETONLYDATA;
            if (filterData.PARENTENTITY) filterData.PARENTENTITY.KEY = this.props?.schema?.entityValue
            if (!filterData.PARAMETERS) filterData.PARAMETERS = [];
            filterData.PARAMETERS.push({
              KEY: "@value",
              VALUE: filterData.VIEWPARENTENTITY?.VALUE || filterData.PARENTENTITY?.VALUE || ""
            })
          }
          // if (this.props?.schema?.entityTypeValue === "procedure") {
          //   if (!filterData.PARAMETERS) filterData.PARAMETERS = [];
          //   filterData.PARAMETERS.push({
          //     KEY: "@value",
          //     VALUE: filterData.VIEWPARENTENTITY?.VALUE || ""
          //   })
          // }
          this.props.tableDataForm(
            "PARAMETERS",
            { PARAMETERS: filterData.PARAMETERS },
            "",
            "updateTableEntity"
          );
          
          let isChildForm = this.props.tableDataInput.PARENTENTITY
          && (
            (this.props.schema.entityDestination !== null
              && this.props.tableDataInput.PARENTENTITY.KEY !== this.props.schema.entityDestination)
            || (this.props.schema.entityDestination === null
              && this.props.tableDataInput.PARENTENTITY.KEY !== this.props.schema.entityValue)
          );

          if (!filterData.PARENTENTITY || !filterData.PARENTENTITY.KEY || ( typeof isChildForm !== "undefined" && !isChildForm)) {
            delete filterData.PARENTENTITY;
          }

          ApolloClientService.getData("query", API.getData, filterData).then(
            res => {
              if (res.errors) {
                //reject("Error");
              } else {
                let resultData = JSON.parse(res.data.getData ? res.data.getData.DATA : "[]")
                // let isdefaultSorting = find(this.props.schema.columns, { defaultSorting: true });
                // if (isdefaultSorting) {
                //   let columnSortType = isdefaultSorting?.columnSortType ? isdefaultSorting.columnSortType : "asc";
                //   resultData = orderBy(resultData, isdefaultSorting.fieldName, columnSortType)
                // }
                resolve(
                  res.data.getData
                );
                if (this.props.location.hash && !this.props.utilityData?.isParentPanelOpened) {
                  let data = JSON.parse(res.data.getData ? res.data.getData.DATA : "[]");
                  this.props.tableDataForm(
                    "selectionIndex",
                    { selectionIndex: 0 },
                    "",
                    "updateTableEntity"
                  );
                  this.props.setUtilData("isParentPanelOpened", true);
                  this.props.schema.updatedItems(
                    data,
                    this.props.schema.entityDestination,
                    this.props.schema.columns
                  );
                  const cmdItem = find(this.props.schema.commandBarItems, (item) => item.key === 'Edit');
                  this.commandbarItemClicks(cmdItem, this.props.schema, null, data[0]);
                } else if (this.props.utilityData?.panelData?.openChildPanel) {
                  const cmdItem = find(this.props.schema.commandBarItems, (item) => item.key === this.props.utilityData?.panelData?.panelAction);
                  if (cmdItem) {
                    this.commandbarItemClicks(cmdItem, this.props.schema);
                  }
                } else if (
                  this.props.currentOperation.operationType === "editTable" ||
                  this.props.currentOperation.operationType ===
                  "historyTable" ||
                  (this.props.currentOperation.operationType === "" &&
                    this.props.currentOperation.parentOperation ===
                    "addTable") ||
                  this.props.formJSON?.isDataLoad === 1
                  || this.state.schema.entityTypeValue === "procedure"
                  || this.state.schema.entityTypeValue === "functions"
                  //|| filterData.APPLYCONTEXT
                  || (
                    this.props.forceRefreshList === true
                    && (
                      this.props.tableDataInput.PARENTENTITY
                      && (
                        (this.state.schema.entityTypeValue === "view"
                          && this.props.tableDataInput.PARENTENTITY.KEY !== this.state.schema.entityDestination)
                        || (this.state.schema.entityTypeValue === "table"
                          && this.props.tableDataInput.PARENTENTITY.KEY !== this.state.schema.entityValue)
                      )
                    )
                  )
                ) {
                  let result =
                    res.data.getData !== null
                      ? JSON.parse(res.data.getData.DATA)
                      : [];
                  let isdefaultSorting = find(this.props.schema.columns, { defaultSorting: true });
                  if (isdefaultSorting) {
                    let columnSortType = isdefaultSorting?.columnSortType ? isdefaultSorting.columnSortType : "asc";
                    result = orderBy(resultData, isdefaultSorting.fieldName, columnSortType)
                  }
                  if (this.props.schema?.groupBy) {
                    result = orderBy(result, [this.props.schema.groupBy], [this.props.schema.groupBySortType])
                  }
                  if (
                    this.state.schema.entityTypeValue === "view" &&
                    this.state.schema.entityDestination
                  ) {
                    this.props.tableDataForm(
                      this.state.schema.entityDestination,
                      result
                    );
                  }
                  this.props.tableDataForm(
                    this.state.schema.entityValue,
                    result
                  );
                  this.props.dataFromDatabase(
                    this.state.schema.entityValue,
                    result
                  );
                }
              }
            }
          );
        }
      }
    });
  };

  groupedItems = data => {
    let items = [];
    if (data && data.length > 0) {
      let groupedItems = groupBy(data, this.state.schema.groupBy);
      let i = 0;
      forEach(groupedItems, x => {
        items.push({
          name: this.state.schema.groupBy,
          startIndex: i,
          count: x.length
        });
        i = i + x.length;
      });
    }
    return items;
  };

  onClickControl = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
  };

  next = e => {
    e.stopPropagation();
    // this.props.updateTabIndex(this.state.formId, "INC");
    this.props.updateTabIndex(this.props.tabListData[0].component.props.formId, "INC");
  };

  back = e => {
    e.stopPropagation();
    // this.props.updateTabIndex(this.state.formId, "DEC");
    this.props.updateTabIndex(this.props.tabListData[0].component.props.formId, "DEC");
  };

  finishButtonValidation() {
    /** Finish button validation Start */
    let isFinishEnable = true;
    // isFinishEnable =
    //   this.props.totalTabValidations &&
    //     this.props.totalTabValidations.validations &&
    //     this.props.totalTabValidations.validations.length > 0 &&
    //     this.props.totalTabValidations.isValid === false
    //     ? true
    //     : false;
    // if (this.props.childFormValidation) {
    //   if ((this.props.childFormValidation.validations &&
    //     this.props.childFormValidation.validations.length > 0)
    //     || (this.props.childFormValidation.innerChildValidations &&
    //       this.props.childFormValidation.innerChildValidations.length > 0)
    //   ) {
    //     isFinishEnable = this.props.childFormValidation.isValid === false;
    //   }
    // }
    let validationArray = cloneDeep(this.props.validationArray);
    let validate = validationArray[0];
    isFinishEnable = validate &&
      validate.validations &&
      validate.validations.length > 0 &&
      validate.isValid === false ? true : false;
    return isFinishEnable;
    /** Finish button validation End */
  }

  onTabFooterContent = () => {
    let defaultButtons = null;
    let totalValidation = { validation: { isValid: false } };
    let validationArray = cloneDeep(this.props.validationArray);
    let validate = validationArray[0];
    if (validate && validate.validations
      && validate.validations.length > 0
      && this.props.accordianDetails.length > 0) {
      var result = [];
      this.props.accordianDetails.forEach(accordian => {
        let formValidation = find(validate.validations, {
          formId: accordian.formId
        });
        // if (this.props.childFormValidation.validations.length > 0) {
        //   formValidation = find(this.props.childFormValidation.validations, {
        //     formId: accordian.formId
        //   });
        // }
        if (formValidation && formValidation.validation) {
          result.push(formValidation.validation.isValid);
        }
      });
      let formResult = result.filter(x => {
        return x === false;
      });
      if (totalValidation) {
        totalValidation.validation = {
          ...totalValidation.validation,
          isValid: formResult[0]
        };
      }
    } else if (
      this.props.currentTabOperation &&
      this.props.currentTabOperation.currentTab &&
      this.props.tabListData.length > 0 &&
      validate &&
      validate.validations.length > 0
    ) {
      let tabDetails = find(this.props.tabListData, {
        step: this.props.currentTabOperation[
          this.props.currentTabOperation.currentTab
        ]
      });
      if (tabDetails && tabDetails.component && tabDetails.component.props) {
        totalValidation = find(validate.validations, {
          formId: tabDetails?.component.props.formId
        });
      }
      // if (this.props.childFormValidation.validations.length > 0) {
      //   totalValidation = find(this.props.childFormValidation.validations, {
      //     formId: tabDetails?.component.props.formId
      //   });
      // }
      if (totalValidation && !totalValidation.validation) {
        totalValidation.validation = { isValid: false };
      }
    } else if (
      validate &&
      validate.validations.length === 0
    ) {
      totalValidation.validation = { isValid: true };
    } else totalValidation.validation = { isValid: true };

    let isFinishEnable = this.finishButtonValidation();

    if (
      this.state.commandbarActionType === "historyTable" ||
      this.state.commandbarActionType === "viewTable"
    ) {
      defaultButtons = [
        <PrimaryButton onClick={this.closePanel}>
          {this.trans("Close")}
        </PrimaryButton>
      ];
    } else if (
      (this.state.commandbarActionType === "addTable" ||
        this.state.commandbarActionType === "Navigate") &&
      this.props.currentTabOperation.isTab
    ) {
      defaultButtons = [
        this.props.currentTabOperation[this.props.tabListData[0]?.component.props.formId] === 1
          ? [
            <DefaultButton style={{ visibility: "hidden" }}>
              {this.trans("Hidden")}
            </DefaultButton>,
            <PrimaryButton
              disabled={
                totalValidation &&
                totalValidation.validation &&
                totalValidation.validation.isValid === false
              }
              onClick={this.next}
            >
              {this.trans("Next")}
            </PrimaryButton>
          ]
          : this.props.currentTabOperation[this.props.tabListData[0]?.component.props.formId] !==
            Object.keys(this.props.tabListData).length
            ? [
              <DefaultButton onClick={this.back}>
                {this.trans("Back")}
              </DefaultButton>,
              <PrimaryButton
                disabled={
                  totalValidation &&
                  totalValidation.validation &&
                  totalValidation.validation.isValid === false
                }
                onClick={this.next}
              >
                {this.trans("Next")}
              </PrimaryButton>
            ]
            : this.props.currentTabOperation[this.props.tabListData[0]?.component.props.formId] ===
              Object.keys(this.props.tabListData).length
              ? [
                <DefaultButton onClick={this.back}>Back</DefaultButton>,
                <PrimaryButton
                  onClick={this.saveData}
                  disabled={isFinishEnable || this.state.isBtnDisabled}
                >
                  {this.trans("Finish")}
                </PrimaryButton>
              ]
              : []
      ];
    } else {
      defaultButtons = [
        <PrimaryButton
          onClick={this.saveData}
          disabled={isFinishEnable || this.state.isBtnDisabled}
        >
          {this.trans("Save")}
        </PrimaryButton>,
        <DefaultButton key={Math.random()} onClick={this.closePanel}>
          {this.trans("Cancel")}
        </DefaultButton>
      ];
    }

    return (
      <div className="ms-Grid">
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-u-sm8 ms-u-md8 ms-u-lg8">
            <div className="btn-grp">{defaultButtons}</div>
          </div>
        </div>
      </div>
    );
  };

  viewAction = (x, itemSelected) => {
    var VIEWPARENTENTITY = "";
    let selectedvalue = ""
    let entityAction = x.entityLinkAction
    if (x.componentAction === "viewTable") {
      //This is to fix view request from History tab
      if (entityAction) {
        selectedvalue = entityAction ? itemSelected[entityAction] : itemSelected.VFUUID
      }
      else if (x.commandbarTittle === "View Request" && itemSelected?.REFERENCENUM) {
        selectedvalue = itemSelected?.REQUESTUID
      }
      else {
        selectedvalue = !isEmpty(itemSelected) && itemSelected.VFUUID
          ? itemSelected.VFUUID
          : itemSelected.REFERENCENUM
            ? itemSelected.REFERENCENUM
            : itemSelected.AREAUUID
              ? itemSelected.AREAUUID
              : itemSelected.REQUESTUUID
                ? itemSelected.REQUESTUUID
                : "";
      }
      VIEWPARENTENTITY = {
        KEY: x.commandBarEntity,
        // VALUE:
        //   !isEmpty(itemSelected) && itemSelected.VFUUID
        //     ? itemSelected.VFUUID
        //     : itemSelected.REFERENCENUM
        //       ? itemSelected.REFERENCENUM
        //       : itemSelected.AREAUUID
        //         ? itemSelected.AREAUUID
        //         : "",
        VALUE: selectedvalue,
        IDENTITYUUID: !isEmpty(itemSelected) && itemSelected.IDENTITYUUID
          ? itemSelected.IDENTITYUUID : null
      };
      // this.props.clearDataForm(x.commandBarEntity, "historyData");
      // this.props.clearDataForm(this.state.schema.entityValue, "historyData");
    } else if (x.componentAction === "historyTable") {
      this.props.clearDataForm("VW_IDENTITY_PHOTOS_HISTORY", "historyData");
      this.props.clearDataForm("VW_ENTITY_HISTORY", "historyData");
      this.props.clearDataForm("VW_IDENTITY_HISTORY", "historyData");
      VIEWPARENTENTITY = {
        KEY: x.commandBarEntity,
        VALUE: !isEmpty(itemSelected) ? itemSelected.VFUUID : ""
      };
      var PARAMETERS = [
        {
          KEY: "ENTITYNAME",
          VALUE:
            x.commandBarEntity !== null && x.commandBarEntity !== ""
              ? x.commandBarEntity
              : this.state.schema.entityDestination !== null
                ? this.state.schema.entityDestination
                : this.state.schema.entityValue
        },
        { KEY: "ENTITYID", VALUE: itemSelected.VFUUID }
      ];
      this.props.tableDataForm(
        "PARAMETERS",
        { PARAMETERS: PARAMETERS },
        "",
        "updateTableEntity"
      );
    }
    this.props.tableDataForm(
      "VIEWPARENTENTITY",
      { VIEWPARENTENTITY: VIEWPARENTENTITY },
      "",
      "updateTableEntity"
    );
  };

  navigateAction = x => {
    const panelType = 4;
    const customTextInPixel =
      x.panelSize === "7" ? x.customTextInPixel : undefined;
    if (!this.props.tableDataInput.PARENTENTITY) {
      let PARENTENTITY = {
        KEY:
          this.state.schema.entityDestination !== null
            ? this.state.schema.entityDestination
            : this.state.schema.entityValue,
        APPLYCONTEXT: this.state.schema.entityDestination === "REQUESTS" ? false : true
      };
      this.props.tableDataForm(
        "PARENTENTITY",
        { PARENTENTITY: PARENTENTITY },
        "",
        "updateTableEntity"
      );
    }

    // this.props.setSaveCurrentOperation("addTable");
    this.setState({
      showNavigationPanel: true,
      formId: x.formId,
      formName: x.name,
      panelType,
      customTextInPixel,
      commandbarTittle: x.commandbarTittle,
      commandbarDescription: x.commandbarDescription,
      commandbarActionType: x.componentAction,
      isFinalSave: x.isFinalSave
    });
  };

  deleteAction = (x, schema, itemSelected) => {
    // Need to check
    let finalList = [];

    this.itemSelectedForDelete =
      this.selection.getSelection().length > 0
        ? this.selection.getSelection()
        : [];
    var PARENTENTITY = "";
    if (this.props.dropdownSelectionInput) {
      let drpDownSelection = this.props.dropdownSelectionInput[
        schema.entityValue
      ];
      if (drpDownSelection && this.itemSelectedForDelete.length > 0) {
        finalList = differenceWith(
          drpDownSelection,
          this.itemSelectedForDelete,
          isEqual
        );
        this.props.dropdownSelection(schema.entityValue, "", finalList);
        finalList = [];
      }
    }
    if (this.props.tableDataInput) {
      let srcData = this.props.tableDataInput[schema.entityValue];
      // let destData = this.props.tableDataInput[schema.entityDestination];
      let nonDeletedData = [];
      if (srcData && this.itemSelectedForDelete.length > 0) {
        finalList = differenceWith(
          srcData,
          this.itemSelectedForDelete,
          isEqual
        );
        nonDeletedData = finalList;
        forEach(this.itemSelectedForDelete, d => {
          d.DELETED = true;
          d.isModified = true;
        });
        finalList = finalList.concat(this.itemSelectedForDelete);
        if (!isUndefined(this.props.saveDataInput[schema.entityValue])) {
          this.props.saveDataForm(
            schema.entityValue,
            "appendData",
            this.itemSelectedForDelete
          );
        } else {
          this.props.saveDataForm({
            [schema.entityValue]: finalList
          });
          if (schema.entityDestination && schema.entityDestination !== null) {
            this.props.saveDataForm({
              [schema.entityDestination]: finalList
            });
          }
        }
        if (schema.groupBy) {
          this.props.tableDataForm(schema.entityValue, nonDeletedData);
        } else {
          this.props.tableDataForm(schema.entityValue, finalList);
        }
        if (schema.entityDestination && schema.entityDestination !== null) {
          if (
            !isUndefined(this.props.saveDataInput[schema.entityDestination])
          ) {
            this.props.tableDataForm(
              schema.entityDestination,
              this.itemSelectedForDelete,
              "",
              "appendData"
            );
            this.props.saveDataForm(
              schema.entityDestination,
              "appendData",
              this.itemSelectedForDelete
            );
          } else {
            this.props.tableDataForm(schema.entityDestination, finalList);
            this.props.saveDataForm({
              [schema.entityDestination]: finalList
            });
          }
        }

        finalList = [];
      }
      this.itemSelectedForDelete = [];
      finalList = [];
    }
    var selectedItems = this.selection.getSelection();
    forEach(selectedItems, d => {
      d.DELETED = true;
      d.isModified = true;
    });
    this.selection.setItems(this.itemSelectedForDelete, true);
    // Need to check
    if (
      x.commandBarEntity &&
      x.commandBarEntity !== "" &&
      x.componentAction === "deleteTable"
    ) {
      if (x.commandBarEntity !== "IDENTITIES") {
        PARENTENTITY = {
          KEY: x.commandBarEntity,
          VALUE: !isEmpty(itemSelected) ? itemSelected.VFUUID : ""
        };
      }

      if (this.state.schema.entityDestination !== null) {
        this.props.saveDataForm({
          [this.state.schema.entityDestination]: this.selection.getSelection()
        });
      }
    }
    // Need to check
    if (!!PARENTENTITY && this.state.schema.entityTypeValue !== "view") {
      this.props.tableDataForm(
        "PARENTENTITY",
        { PARENTENTITY: PARENTENTITY },
        "",
        "updateTableEntity"
      );
    }
    if (this.state.showConfirmation) {
      let objType = schema?.entityValue === "VW_IDENTITY_DELEGATES" ? "DELEGATE" : schema?.entityValue === "VW_MYACCESSAREAS" ? "MYAREAS" : "";
      this.setState({ showDialogBox: false, isOverlay: true }, () => {
        this.deleteSaveData(schema.entityDestination, selectedItems, objType);
      })
      this.setState({ showDialogBox: false });
      this.props.setSaveCurrentOperation(
        this.props.currentOperation.parentOperation
      );
    }
    if (
      schema.componentName === "TableAddAndSearchComponent"
      && schema.required === true) {
      this.props.onSetWizardComponent({ "runTableMandatory": true });
    }
  };
  deleteSaveData = (destEntity, items, objType) => {
    let PARENTENTITY = {};
    let inputData = {};
    if (this.props.tableDataInput) {
      PARENTENTITY = this.props.tableDataInput["PARENTENTITY"];
    }
    inputData = {
      ENTITY: destEntity,
      DATA: JSON.stringify({ [destEntity]: items })
    }
    if (PARENTENTITY.KEY) {
      inputData.PARENTENTITY = PARENTENTITY;
    }
    else if (objType && objType !== "") {
      inputData.PARENTENTITY = {
        KEY: "IDENTITIES",
        VALUE: objType === "MYAREAS" ? this.props?.tableDataInput["IDENTITY_AREAS"][this.props?.tableDataInput?.selectionIndex].IDENTITYUUID : PARENTENTITY.VALUE
      };
    }
    ApolloClientService.getData("query", API.saveData, inputData).then(res => {
      if (res.errors) {
      } else {
        this.setState({ isOverlay: false })
        if (
          (PARENTENTITY &&
            this.props.currentOperation.operationType !== "historyTable" &&
            this.props.currentOperation.operationType !== "viewTable" &&
            (PARENTENTITY.KEY === this.state.schema.entityValue ||
              (this.state.schema.entityTypeValue === "view" &&
                this.state.schema.entityDestination === PARENTENTITY.KEY))) ||
          this.props.currentOperation.parentOperation === ""
        ) {
          this.props.setSuccessMessage(
            true,
            this.trans("Your record(s) has been succesfully deleted")
          );
        } else {
          this.props.setSuccessMessage(
            false,
            this.trans("Your record(s) has been succesfully deleted"), true
          );
        }
        // this.props.setSuccessMessage(
        //   false,
        //   this.trans("Your record(s) has been succesfully deleted"),
        //   true
        // );
        this.props.onSetWizardComponent({ forceRefreshList: true });
      }
    });
  }
  onDialogBoxDismiss = () => {
    this.setState({ showDialogBox: false, showWarning: false });
    this.props.setSaveCurrentOperation(
      this.props.currentOperation.parentOperation
    );
  }

  onAlertDialogBoxDismiss = () => {
    this.setState({ showAlertBox: false, showExportDialog: false, isExport: false, showPanel: false });
  }

  onChangeEvent = (e, options, index, name, componentName) => {
    let key = "",
      value = componentName === "DropdownComponent" ? false : "";
    if (componentName === "ChoiceGroupComponent") {
      key = name;
      value = options.key;
    }
    this.setState(
      {
        [key]: value
      }
    );
  };

  exportData = (tableHeader, schema, sortData) => {
    let parameters = {};
    if (ctrl2.selection._isAllSelected) {
      parameters = ctrl2.props.tableDataInput.PARAMETERS;
    } else {
      let items = ctrl2.selection.getSelection();
      let ids = [];
      items.forEach((item) => {
        ids.push(item.VFUUID);
      });
      if (ids?.length) {
        parameters = [{ KEY: "VFUUID", VALUE: ids.join(","), OPERATION: "IN" }];
      } else {
        parameters = ctrl2.props.tableDataInput.PARAMETERS;
      }
    }
    let columns = schema?.columns;
    ctrl2.props.setSuccessMessage(
      true,
      ctrl2.trans(`backgroundImportMsg`),
      false,
      false,
      true
    );
    if (!parameters?.length && schema?.entityTypeValue?.toLowerCase() === "procedure") {
      parameters = [{
        KEY: "@KEY",
        VALUE: ""
      }];
    }
    // if (parameters) {
    //   if (ctrl2.props?.tableDataInput?.PARENTENTITY)
    //     parameters.PARENTENTITY = ctrl2.props.tableDataInput.PARENTENTITY;
    //   else if (ctrl2.props?.tableDataInput?.VIEWPARENTENTITY)
    //     parameters.PARENTENTITY = ctrl2.props.tableDataInput.VIEWPARENTENTITY;
    //   if (has(parameters.PARENTENTITY, "IDENTITYUUID") && !parameters.PARENTENTITY?.IDENTITYUUID)
    //     parameters.PARENTENTITY = omit(parameters.PARENTENTITY, "IDENTITYUUID");
    // }
    let dateName = moment(new Date(moment(new Date()))).format("YYYY-MM-DD");
    let fileName = cloneDeep(tableHeader);
    if (!fileName?.length) fileName = ctrl2.props.formJSON?.formName;
    let tableDataInput = cloneDeep(ctrl2.props?.tableDataInput);
    tableDataInput = assignIn(tableDataInput, sortData);
    getExportData(schema?.entityValue, parameters, `${dateName + (fileName ? " " + fileName : "")}`, columns, ctrl2.state.exportFormatValue, false, tableDataInput);
    ctrl2.selection.setAllSelected(false);
    ctrl2.setState({ isExport: false, showPanel: false });
    ctrl2.importStatus = PubSub.subscribe("IMPORTCOMPLETED", (msg, data) => {
      if (data) {
        ctrl2.props.setSuccessMessage(
          true,
          ctrl2.trans('importCompleteMsg'),
          false,
          false,
          false
        );
      } else {
        setTimeout(() => {
          ctrl2.props.setSuccessMessage(
            true,
            ctrl2.trans('importFailedMsg'),
            false,
            false,
            true
          );
        }, 1000);
      }
    });
  }

  commandbarItemClicks = (x, schema, index, selectedItem) => {

    var PARENTENTITY = {};
    if (x.commandBarEntityFields) {
      this.props.clearDataForm(x.commandBarEntity);
      PARENTENTITY = {
        KEY: x.commandBarEntity,
        VALUE: x.commandBarEntityFields
      }
    }
    if (this.props.formJSON.entity === "VW_IDENTITY_DELEGATES") {
      if (this.props.dropdownSelectionInput["TASKTYPE"]) {
        this.props.dropdownSelection("TASKTYPE", "", { key: "", text: "" });
      }
    }
    if (
      !isUndefined(index) &&
      isNumber(index) &&
      index >= 0 &&
      this.props.selectionMode !== "Single"
    ) {
      this.selection.setAllSelected(false); // this.selection.setIndexSelected() internally calls this.selection.setAllSelected(false) function
      this.selection.setIndexSelected(index, true, true);
    }
    if (x.componentAction === "None") {
      this.props.clearDataForm();
      var tableSelection = this.selection._selectedIndices?.length && this.selection._items?.length ? this.selection._items[this.selection._selectedIndices[0]] : this.selection.getItems()[index];

      let parentId = this.props.tableDataInput?.VIEWPARENTENTITY?.VALUE ? this.props.tableDataInput?.VIEWPARENTENTITY?.VALUE : this.props.tableDataInput?.PARENTENTITY?.VALUE ? this.props.tableDataInput?.PARENTENTITY?.VALUE : "";
      let TABLEENTITY = {
        PARENTID: parentId,
        KEY: x.commandBarEntity,
        VALUE: !isEmpty(tableSelection) ? tableSelection?.VFUUID?.length ? tableSelection?.VFUUID : tableSelection?.SETTINGNAME : "",
        FORMID: x.formId,
        TITLE: !isEmpty(tableSelection) && tableSelection?.TITLE?.length ? tableSelection.TITLE : ''
      };
      this.props.tableDataForm(
        "TABLEENTITY",
        { TABLEENTITY: TABLEENTITY },
        "",
        "updateTableEntity"
      );
      this.selection.setIndexSelected(this.selection._selectedIndices?.length ? this.selection._selectedIndices[0] : index, true);

      return;
    }
    if (x.commandbarDisplayType === "alert" || x.commandbarDisplayType === "formPanel") {
      this.displayType = x.commandbarDisplayType;
      this.setState({
        formId: x.formId,
        showAlertBox: true,
        isFinalSave: x.isFinalSave,
        commandbarTittle: x.commandbarTittle,
        saveBtnText: x.saveBtnText,
        closeBtnText: x.closeBtnText,
        type: this.displayType
      })
    }
    let panelActionArray = cloneDeep(this.props.panelActionArray)
    panelActionArray.push(x.componentAction);
    let validationArray = cloneDeep(this.props.validationArray);
    validationArray.unshift({ validations: [], isValid: true });
    this.props.setUtilData("newAddMandatory", []);
    this.props.onSetWizardComponent({
      panelActionArray: panelActionArray,
      validationArray: validationArray
    });
    let componentAction = x.componentAction === "Navigate" ? "addTable" : x.componentAction;
    let itemSelected =
      this.selection.getSelection().length > 0
        ? this.selection.getSelection()[0]
        : selectedItem ? selectedItem : {};
    if (
      x.componentAction === "viewTable" ||
      x.componentAction === "historyTable"
    ) {
      this.viewAction(x, itemSelected);
    } else if (x.componentAction === "Navigate") {
      this.navigateAction(x);
      if (this.props.currentTabOperation.isTab)
        this.props.updateTabIndex("", "", false);
    } else if (x.componentAction === "Export") {
      this.setState({ control: x, controlSchema: schema, exportIndex: index, exportSelectedItem: selectedItem })

      this.exportData(ctrl2.props?.schema?.tableHeader);
    } else if (
      x.componentAction === "deleteTable" &&
      (!x.formId || x.formId === "" || x.formId === null)
    ) {
      if (x.showConfirmation && !x.showWarning) {
        this.setState({
          showDialogBox: true,
          confirmationTittle: x.confirmationTittle,
          confirmationContent: x.confirmationContent,
          itemSelected: itemSelected,
          isFinalSave: x.isFinalSave,
          saveBtnText: x.saveBtnText ? x.saveBtnText : "Yes",
          closeBtnText: x.closeBtnText ? x.closeBtnText : "No",
          showConfirmation: x.showConfirmation
        })
      }
      else if (x.showWarning) {
        this.setState({
          showDialogBox: true,
          confirmationTittle: x.confirmationTittle,
          confirmationContent: x.confirmationContent,
          //itemSelected: itemSelected,
          //isFinalSave: x.isFinalSave,
          saveBtnText: x.saveBtnText,
          closeBtnText: x.closeBtnText,
          //showConfirmation: x.showConfirmation
          showWarning: x.showWarning
        })
      }
      else {
        this.deleteAction(x, schema, itemSelected);
      }
    } else if (x.componentAction === "deleteTable") {
      this.props.setSaveCurrentOperation(componentAction);
    } else {
      if (this.props.currentTabOperation.isTab)
        this.props.updateTabIndex("", "", false);
    }

    this.props.setHeaderInfo(x.commandbarDescription);
    var VIEWPARENTENTITY = "";
    if (this.props.dropdownSelectionInput) {
      Object.keys(this.props.dropdownSelectionInput).forEach(x => {
        if (
          x?.split("**")[1] && x.split("**")[1] !== "DESTINATION" &&
          this.state.schema.entityValue !== x
        ) {
          this.props.onResetMultiselect(x);
          this.props.clearDataForm();
        }
      });
    }

    if (this.props.successMessage.isSuccess || this.props.successMessage.panel)
      this.props.setSuccessMessage(false, null, false);
    if (
      x.commandBarEntity === this.state.schema.entityValue ||
      (this.state.schema.entityTypeValue === "view" &&
        this.state.schema.entityDestination === x.commandBarEntity)
    ) {
      if (
        x.componentAction !== "historyTable" &&
        x.componentAction !== "viewTable" &&
        this.props.tableDataInput.PARENTENTITY === x.commandBarEntity
      ) {
        this.props.onResetAllState();
      }
      this.props.setSaveCurrentOperation(componentAction);
    } else if (x.componentAction !== "deleteTable") {
      let innerChildValidations = [];
      if (this.props.childFormValidation.validations.length > 0) {
        innerChildValidations = cloneDeep(
          this.props.childFormValidation.validations
        );
      }
      this.props.onSetWizardComponent({
        childFormValidation: {
          validations: [],
          innerChildValidations: innerChildValidations,
          isValid: true
        },
        currentEntityValue: this.state.schema.entityValue
      });
      this.props.setSaveCurrentOperation(componentAction, "inprogress");
    }
    if (
      (x.componentAction === "editTable" && !isEmpty(itemSelected)) ||
      x.componentAction === "addTable" ||
      x.componentAction === "deleteTable"
    ) {
      if (x.componentAction === "addTable") {
        const selectionCount = this.selection.getSelectedCount();
        if (selectionCount) {
          this.selection.setAllSelected(false);
        }

        delete this.props.tableDataInput.selectionIndex;
        if (
          isUndefined(
            this.props.dropdownSelectionInput[
            this.state.schema.entityValue + "**DESTINATION"
            ]
          )
        ) {
          this.props.clearDataForm(this.state.schema.entityValue);
        }
        if (this.state.schema.entityTypeValue === "view") {
          this.props.clearDataForm(this.state.schema.entityDestination);
        }
        if (
          !isUndefined(this.props.saveDataInput["REQUESTS"]) &&
          !isUndefined(this.props.saveDataInput["REQUESTS"]["REQUESTTYPE"]) &&
          this.props.saveDataInput["REQUESTS"]["REQUESTTYPE"] ===
          "Request Access"
        )
          this.props.clearDataForm("REQUESTS");
        PARENTENTITY = this.props.tableDataInput.PARENTENTITY
          ? this.props.tableDataInput.PARENTENTITY
          : {};
      }
      if (
        isUndefined(this.props.tableDataInput.PARENTENTITY) ||
        isNull(this.props.tableDataInput.PARENTENTITY)
        || this.props.tableDataInput.PARENTENTITY.KEY === ""
      ) {
        if (
          x.componentAction === "deleteTable" &&
          x.commandBarEntity === "REQUESTS"
        ) {
          PARENTENTITY = {
            KEY: x.commandBarEntity,
            VALUE: ""
          };
        } else {
          PARENTENTITY = {
            KEY: x.commandBarEntity,
            VALUE:
              x.componentAction === "addTable"
                ? ""
                : !isEmpty(itemSelected)
                  ? itemSelected.VFUUID
                  : ""
          };
        }
      }
      if (x.componentAction === "editTable") {
        if (!isUndefined(this.props.tableDataInput.PARAMETERS)) {
          this.props.tableDataForm(
            "PARAMETERS",
            "",
            "",
            "deleteTableEntity"
          );
        }
        if (
          x.commandBarEntity !== this.state.schema.entityValue &&
          this.state.schema.entityTypeValue !== "view"
        ) {
          PARENTENTITY = this.props.tableDataInput.PARENTENTITY;
        } else {
          PARENTENTITY = {
            KEY: x.commandBarEntity,
            VALUE: !isEmpty(itemSelected) ? itemSelected.VFUUID : ""
          };
        }
        if (x.componentAction === "editTable") {
          this.props.clearDataForm(this.state.schema.entityValue, "");
          if (this.state.schema.entityDestination !== "")
            this.props.clearDataForm(this.state.schema.entityDestination, "");
        }
        if (
          (!!this.props.tableDataInput.VIEWPARENTENTITY &&
            isUndefined(this.props.tableDataInput.VIEWPARENTENTITY)) ||
          isNull(this.props.tableDataInput.VIEWPARENTENTITY)
        ) {
          VIEWPARENTENTITY = {
            KEY: x.commandBarEntity,
            VALUE: !isEmpty(itemSelected) ? itemSelected.VFUUID : ""
          };
          this.props.tableDataForm(
            "VIEWPARENTENTITY",
            { VIEWPARENTENTITY: VIEWPARENTENTITY },
            "",
            "updateTableEntity"
          );
        }
      }
      if (
        (!!PARENTENTITY &&
          isUndefined(this.props.tableDataInput.PARENTENTITY)) ||
        isNull(this.props.tableDataInput.PARENTENTITY)
        || this.props.tableDataInput.PARENTENTITY.KEY === ""
      ) {
        this.props.tableDataForm(
          "VIEWPARENTENTITY",
          { VIEWPARENTENTITY: VIEWPARENTENTITY },
          "",
          "updateTableEntity"
        );
        this.props.tableDataForm(
          "PARENTENTITY",
          { PARENTENTITY: PARENTENTITY },
          "",
          "updateTableEntity"
        );
      }

      let obj = this.trans("TableClick", {
        commandbarTittle: x.commandbarTittle,
        formId: x.formId
      });
      this.props.updateLog(obj);
    }
    if (
      "wizard" === x.componentType ||
      "tab" === x.componentType ||
      "accordian" === x.componentType
    ) {
      this.props.onSetWizardComponent({
        ["is" +
          x.componentType.charAt().toUpperCase() +
          x.componentType.substr(1)]: true,
        currentFormName: x.name,
        commandbarTittle: x.commandbarTittle,
        commandbarDescription: x.commandbarDescription
      });
    }
    if ("wizard" === x.componentType) {
      this.wizardCommandbarPanel(x, index);
    } else {
      if (x.commandBarEntity && x.commandBarEntity !== "") {
        this.commandbarPanel(x, index);
      }
    }
  };

  panelHeader = (schme, isNavigation) => {
    let headerInfo = !isUndefined(this.props.headerInfo.title)
      ? this.props.headerInfo.title
      : this.state.commandbarDescription;
    if (
      this.props.currentRequestNav &&
      Object.keys(this.props.currentRequestNav).length > 0 &&
      !isNavigation
    ) {
      return (
        <Fragment>
          {this.props.currentRequestNav.navigationFormHeader ?
            <div className="panel-headerwicon">
              <VFText
                Textvariant={"xxLarge"}
                Textcont={this.props.currentRequestNav.navigationFormHeader}
              />
              <VFText
                Textvariant={"medium"}
                Textcont={this.props.currentRequestNav.navigationFormDescription}
              />
            </div> : ""}
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          {this.state.commandbarTittle ?
            <div className="panel-headerwicon">
              <VFText
                Textvariant={"xxLarge"}
                Textcont={this.props.currentRequestNav
                  && this.props.currentRequestNav.navigationFormHeader
                  && (this.props.panelActionArray[this.props.panelActionArray.length - 1] === "Navigate")
                  ? this.props.currentRequestNav.navigationFormHeader : this.state.commandbarTittle}
              />
              <VFText
                TextClass="panel-desc"
                Textvariant={"small"}
                Textcont={headerInfo}
              />
            </div> : ""}
        </Fragment>
      );
    }
  };
  closeMessageBar = () => {
    if (this.props.successMessage.isSuccess || this.props.successMessage.panel)
      this.props.setSuccessMessage(false, null, false);
  }
  headerrender = () => {
    const { refresh, id, successMessage } = this.state;
    return (
      <Fragment>
        {this.props.wizardName ?
          <div className="panel-headerwicon">
            <VFText
              Textvariant={"xxLarge"}
              Textcont={this.props.wizardName}
            ></VFText>

            <ActionButton
              iconProps={{ iconName: "Refresh" }}
              className="refresh"
              onClick={(e) => refresh({ id: id, isRefresh: true })}
            ></ActionButton>
          </div> : ""}
        {successMessage ? (
          <MessageBarComponent
            MessageBarType={MessageBarType.success}
            Multiline={false}
            onDismiss={this.closeMessageBar}
            dismissButtonAriaLabel={this.trans("Close")}
          >
            {this.trans("Details were saved successfully")}
          </MessageBarComponent>
        ) : (
            ""
          )}
      </Fragment>
    );
  };
  onRenderPlainCard = item => {
    let columnHover = find(this.props.schema.columns, { hasHovercard: true })
    return (<VFFormCreator formId={columnHover?.listAllHovercard}
      isHoverCard={columnHover?.hasHovercard}
      hoverID={item?.VFUUID}
    />);
  };

  closeNavigationPanel = (e) => {
    if (!this.props.currentTabOperation.isTab) {
      this.props.updateTabIndex(null, null, true);
    }
    this.setState({
      showPanel: false,
      showNavigationPanel: false
    });
    let panelActionArray = cloneDeep(this.props.panelActionArray)
    panelActionArray.pop();
    this.props.onSetWizardComponent({
      currentRequestNav: {},
      headerInfo: {},
      panelActionArray: panelActionArray
    });
    // this.props.onResetAllState();
  };

  createNavigation = (e) => {
    if (!isUndefined(this.props.saveDataInput["REQUESTS"])) {
      this.props.saveDataForm({
        "REQUESTS": {}
      });
    }
    if (
      this.props.currentRequestNav &&
      Object.keys(this.props.currentRequestNav).length > 0
    ) {
      this.setState({
        showPanel: true,
        showNavigationPanel: false,
        formId: this.props.currentRequestNav.requestFormId
      });
    }
  };

  onNavigationFooter = () => {
    let defaultButtons = null;

    if (this.state.commandbarActionType === "historyTable") {
      defaultButtons = [
        <PrimaryButton onClick={this.closePanel}>Close</PrimaryButton>
      ];
    } else {
      defaultButtons = [
        <PrimaryButton onClick={this.createNavigation}>Create</PrimaryButton>,
        <DefaultButton key={Math.random()} onClick={this.closeNavigationPanel}>
          Cancel
        </DefaultButton>
      ];
    }

    return (
      <div className="ms-Grid">
        <div className="ms-Grid-row">
          <div className="ms-Grid-col ms-u-sm8 ms-u-md8 ms-u-lg8">
            <div className="btn-grp">{defaultButtons}</div>
          </div>
        </div>
      </div>
    );
  };

  onAlertBoxRefreshDismiss = (e) => {
    this.setState({ showAlertBox: false }, () => {
      this.props.clearDataForm();
      this.clearValidations();
      this.closePanel(e);
      this.props.setConditionName(null, null);
      this.props.onSetWizardComponent({ forceRefreshList: true });
      this.setState({ isBtnDisabled: false })
    });
  }

  getIcon = (iconItems, column, fieldContent) => {
    iconItems = compact(iconItems);
    let i = "";
    forEach(iconItems, item => {
      if (
        item && item?.columnName?.length && item?.preText?.length &&
        item.columnName === column.name &&
        item.preText === fieldContent &&
        item.preText !== ""
      ) {
        i = (
          <span>
            <i className={`ms-Icon ms-Icon--${item.icon}`} style={{ color: item?.fillIcon?.length ? item.fillIcon : '#333333' }} aria-hidden="true" />
            &nbsp;
          </span>
        );
      }
    });
    return i;
  };

  checkDateValidation() {
    const { saveDataInput } = this.props;
    var endDateValue;
    if (this.props.formJSON.entity === "IDENTITY_CARDS" || this.props.formJSON.entity === "REQUESTS" || this.props.formJSON.entity === "VW_MYPROFILE_REQUESTS") {
      if (this.props.successMessage.isSuccess || this.props.successMessage.panel) {
        this.props.setSuccessMessage(false, null, false);
      }
      if (!isUndefined(saveDataInput?.IDENTITY_CARDS?.ACTIVATIONDATE) && !isUndefined(saveDataInput?.IDENTITY_CARDS?.DEACTIVATIONDATE) && saveDataInput?.IDENTITY_CARDS?.DEACTIVATIONDATE !== null) {
        endDateValue = saveDataInput?.IDENTITY_CARDS?.DEACTIVATIONDATE === "" ? null : saveDataInput?.IDENTITY_CARDS?.DEACTIVATIONDATE;
        if (new Date(saveDataInput?.IDENTITY_CARDS?.ACTIVATIONDATE).getTime() > new Date(endDateValue).getTime()) {
          this.props.setSuccessMessage(
            false,
            this.trans(`Activation Date can not be greater than Deactivation Date.`),
            true,
            true
          );
          return false;
        }
      }
    /*  Request validationion not required because End Date can not be selected
      if (!isUndefined(saveDataInput?.REQUESTS?.STARTDATE) && !isUndefined(saveDataInput?.REQUESTS?.ENDDATE) && saveDataInput?.REQUESTS?.ENDDATE !== null) {
        endDateValue = saveDataInput?.REQUESTS?.ENDDATE === "" ? null : saveDataInput?.REQUESTS?.ENDDATE;
        if (new Date(saveDataInput?.REQUESTS?.STARTDATE).getTime() > new Date(endDateValue).getTime()) {
          this.props.setSuccessMessage(
            false,
            this.trans(`The End Date cannot be before the Start Date.`),
            true,
            true
          );
          return false;
        }
      } */
      if (!isUndefined(saveDataInput?.IDENTITY_AREAS?.STARTDATE) && !isUndefined(saveDataInput?.IDENTITY_AREAS?.ENDDATE) && saveDataInput?.IDENTITY_AREAS?.ENDDATE !== null) {
        endDateValue = saveDataInput?.IDENTITY_AREAS?.ENDDATE === "" ? null : saveDataInput?.IDENTITY_AREAS?.ENDDATE;
        if (new Date(saveDataInput?.IDENTITY_AREAS?.STARTDATE).getTime() > new Date(endDateValue).getTime()) {
          this.props.setSuccessMessage(
            false,
            this.trans(`The End Date cannot be before the Start Date.`),
            true,
            true
          );
          return false;
        }
      }
    }
    return true;
  }

  checkDuplicateCard = async () => {
    const { saveDataInput } = this.props;
    if (this.props.formJSON.entity === "IDENTITY_CARDS" && (this.props.currentOperation.operationType === "addTable" || this.props.currentOperation.operationType === "editTable")) {
      var input = {
        ENTITY: "VW_IDENTITY_CARDS",
        PARAMETERS: [{ KEY: "CARDNUMBER", VALUE: saveDataInput["IDENTITY_CARDS"].CARDNUMBER, OPERATION: "EQUAL" }],
        FIELDS: ["VFUUID"]
      };
      if (saveDataInput["IDENTITY_CARDS"].VFUUID) {
        input.PARAMETERS.push({ KEY: "VFUUID", VALUE: saveDataInput["IDENTITY_CARDS"].VFUUID, OPERATION: "NOTEQUAL" })
      }
      var response = await ApolloClientService.getData("query", API.getData, input);
      if (response.data.getData.DATA === "[]") {
        return true;
      } else {
        this.props.setSuccessMessage(
          false,
          this.trans(`Card Code already exits.`),
          true,
          true
        );
        return false;
      }
    } else {
      return true;
    }
  }

  checkCardDataValidation() {
    const { saveDataInput } = this.props;
    var strRegExpression;
    if (this.props.formJSON.entity === "IDENTITY_CARDS") {
      if (this.props.successMessage.isSuccess || this.props.successMessage.panel) {
        this.props.setSuccessMessage(false, null, false);
      }
      if (!isUndefined(saveDataInput?.IDENTITY_CARDS?.FORMATID) && !isUndefined(saveDataInput?.IDENTITY_CARDS?.CARDNUMBER)) {
        switch (saveDataInput?.IDENTITY_CARDS?.FORMATID) {
          case 'ctwiqqwjuf':
            strRegExpression = '^[0-9]{6,7}$';
            break;
          case 'eltaazslea':
            strRegExpression = '^1[0-9]{6,7}$';
            break;
          case 'gvrrxnogbr':
            strRegExpression = '^S-[0-9]{6,7}$';
            break;
          case 'kxorntcyri':
            strRegExpression = '^S-[0-9]{4,7}$';
            break;
          case 'mbrahjicpl':
            strRegExpression = '^P-[0-9]{6,7}$';
            break;
          case 'pxzofjaobp':
            strRegExpression = '^T-[0-9]{6,7}$';
            break;
          case 'vrvlcbbfqu':
            strRegExpression = '^[0-9]{8}$';
            break;
          case 'westaccess':
            strRegExpression = '^[0-9]{6,7}$';
            break;
          case 'zhhmoievpq':
            strRegExpression = '^C-[0-9]{6,7}$';
            break;
          case 'gakqfuonxm':
            strRegExpression = '^PC-[0-9]{8}$';
            break;
          case 'hkfgbzxdix':
            strRegExpression = '^PP-[0-9]{8}$';
            break;
          case 'xcdsnqshrj':
            strRegExpression = '^SE-[0-9]{8}$';
            break;
          case 'gpkeylsqjn':
            strRegExpression = '^TT-[0-9]{6,7}$';
            break;
          case 'ieewvnzpxx':
            strRegExpression = '^C-[0-9]{6,7}$';
            break;
          case 'mszwwgvzor':
            strRegExpression = '^SP-[0-9]{6,7}$';
            break;
          case 'ojkyhnaolg':
            strRegExpression = '^WT-[0-9]{6,7}$';
            break;
          case 'uedfputscl':
            strRegExpression = '^C-[0-9]{6,7}$';
            break;
          case 'wvezylmphq':
            strRegExpression = '^H-[0-9]{6,7}$';
            break;
          case 'yuzysemhpl':
            strRegExpression = '^M-[0-9]{6,7}$';
            break;
          default:
            break;
        }
        if (strRegExpression && !saveDataInput?.IDENTITY_CARDS.CARDNUMBER.match(strRegExpression)) {
          this.props.setSuccessMessage(
            false,
            this.trans(`Please enter valid Card Code.`),
            true,
            true
          );
          return false;
        }
      }
    }
    return true;
  }

  componentWillUnmount() {
    PubSub.unsubscribe(this.importStatus);
  }

  getFormattedDate = (item, column) => {
    let fieldContent = item[column.key];
    if (fieldContent && column.columnType === 'defaultDate') {
      fieldContent = moment(fieldContent).format(column.dateFormat?.length ? column.dateFormat : DEFAULT_FORMAT);
      return fieldContent;
    }
    if (fieldContent && column.columnType === 'defaultDateWithoutOffset') {
      fieldContent = moment.utc(fieldContent).format(column.dateFormat?.length ? column.dateFormat : DEFAULT_FORMAT);
      return fieldContent;
    }
    if (fieldContent && column.columnType === 'defaultDateTime') {
      fieldContent = moment(fieldContent).format(column.dateFormat?.length ? column.dateFormat : DEFAULT_FORMAT_TIME);
      return fieldContent;
    }
    if (fieldContent && column.columnType === "defaultDateTimeWithoutZ") {
      if (fieldContent?.length && (fieldContent.indexOf('Z') > -1 || fieldContent.indexOf('z') > -1)) {
        fieldContent = fieldContent.replace('Z', '');
        fieldContent = fieldContent.replace('z', '');
      }
      fieldContent = moment.utc(fieldContent).format(column.dateFormat?.length ? column.dateFormat : DEFAULT_FORMAT_TIME);
      return fieldContent;
    }
    return fieldContent;
  }

  render() {
    let panelElement;
    if (
      this.state.commandBarItems &&
      !isUndefined(this.state.formId) &&
      this.state.formId !== -1
    ) {
      panelElement = <VFFormCreator formId={this.state.formId} />;
    }

    let { schema, componentName, stateData, hasChanged } = this.props;
    const {
      controlModule,
      controlModuleName,
      showlistPropertyWindow,
      showPanel,
      showNavigationPanel,
      panelType,
      customTextInPixel,
      showDialogBox,
      confirmationTittle,
      confirmationContent,
      itemSelected,
      closeBtnText,
      saveBtnText,
      showAlertBox,
      type,
      isExport,
      showExportDialog,
      exportElement
    } = this.state;
    let listElement = null;
    if (
      isUndefined(controlModule) ||
      controlModuleName !== schema.componentName ||
      controlModuleName === ""
    )
      return null;

    schema["onChange"] = (e, options, index) => {
      if (schema["componentName"] === "Dropdown") {
        this.onChangeEvent(
          e,
          options,
          index,
          schema["name"],
          "DropdownComponent"
        );
      } else if (schema["componentName"] === "Checkbox") {
        this.onChangeEvent(e, options, index, schema["name"], "Checkbox");
      } else if (schema["componentName"] === "Toggle") {
        this.onChangeEvent(e, options, index, schema["name"], "Toggle");
      } else this.onChangeEvent(e);
    };
    if (schema.componentName === "TopTilesComponent") {
      schema.tilesPanelForm = (tileFormId, panelTileHeader, panelComponetAction) => {
        this.setState({
          commandbarTittle: panelTileHeader,
          formId: tileFormId,
          commandbarActionType: panelComponetAction
        })
        if (panelComponetAction === "Navigate") {
          this.setState({ showNavigationPanel: true })
        } else {
          this.setState({ showPanel: true })
        }
      }
    }
    if (
      schema.componentName === "Checkbox" ||
      schema.componentName === "Toggle"
    ) {
      if (hasChanged) schema.defaultChecked = schema.value;
      else
        schema.defaultChecked =
          schema.name && this.state[schema.name]
            ? this.state[schema.name]
            : stateData && stateData.schema && stateData.schema[schema["name"]]
              ? stateData.schema[schema["name"]]
              : false;
    } else {
      schema.value =
        schema.name && this.state[schema.name]
          ? this.state[schema.name]
          : stateData && stateData.schema && stateData.schema[schema["name"]]
            ? stateData.schema[schema["name"]]
            : "";
    }

    if (schema.columns !== null && !isUndefined(schema.columns) && schema.columns.length > 0) {
      const hasImageClassName = find(schema.columns, {
        columnType: "showImage"
      });
      if (hasImageClassName) {
        schema.hasImageClassName = "hasImageTableList";
      }
    }

    if (this.newCommandBarItems?.length >= 0) {
      this.commandBarItems1 = cloneDeep(this.commandBarItems);
      this.commandBarItems1 =
        this.commandBarItems1 &&
        this.commandBarItems1.filter(i => i.filterStatus !== true);
      this.commandBarItems1 =
        this.commandBarItems1 &&
        this.commandBarItems1.concat(this.newCommandBarItems);
    }

    if (
      schema.columns !== null &&
      !isUndefined(schema.columns) &&
      schema.columns.length > 0 &&
      schema.columns &&
      !isUndefined(schema.dotShowMore) &&
      schema.dotShowMore === true
    ) {
      let isExist = find(schema.columns, function (obj) {
        return obj.key === "dotShowMore" || obj.key === "MoreVertical";
      });
      let fIndex = findIndex(schema.columns, function (obj) {
        return obj.key === "dotShowMore" || obj.key === "MoreVertical";
      });

      this.filteredItems = !isUndefined(schema.selection)
        ? schema.selection.count > 1
          ? schema.commandBarItems.filter(
            i => i.commandbarConfiguration === "MultiSelect"
          )
          : schema.selection.count === 1 ? this.commandBarItems1.filter(
            i =>
              (i.componentAction !== "addTable" &&
                i.commandbarConfiguration !== "CommandbarOnly" &&
                i.commandbarConfiguration !== "MultiSelect") ||
              i.componentAction === "deleteTable"
          ) : this.commandBarItems1.filter(
            i =>
              (i.componentAction !== "addTable" &&
                i.componentAction !== "historyTable" &&
                i.commandbarConfiguration !== "CommandbarOnly" &&
                i.commandbarConfiguration !== "MultiSelect") ||
              i.componentAction === "deleteTable"
          )
        : schema.commandBarItems.filter(
          i =>
            i.componentAction !== "addTable" &&
            i.componentAction !== "historyTable" &&
            i.commandbarConfiguration !== "CommandbarOnly" &&
            i.commandbarConfiguration !== "MultiSelect" &&
            i.commandbarConfiguration !== "Both"
        );

      let pos = schema.dotShowMorePosition ? schema.dotShowMorePosition : 1;
      if (!isExist) {
        schema.columns = schema.columns.splice(pos, 0, {
          name: "",
          minWidth: 50,
          fieldName: "MoreVertical",
          key: "dotShowMore",
          onRender: (item, index) => {
            return (
              <IconButton
                split={true}
                iconProps={{ iconName: "MoreVertical---" }}
                onMenuClick={() => {
                  if (this.selection.getSelectedIndices()[0] !== index)
                    this.selection.setIndexSelected(index, true);
                }}
                menuProps={{
                  directionalHint: DirectionalHint.bottomLeftEdge,
                  items: this.filteredItems.map(x => ({
                    key: x.key,
                    text: x.name,
                    iconProps: x.iconProps,
                    onClick: (e) => this.commandbarItemClicks(x, schema)
                  }))
                }}
              />
            );
          }
        });
      } else {
        isExist.minWidth = 9;
        if (pos) {
          if (fIndex !== pos) {
            schema.columns.splice(fIndex, 1);
            schema.columns.splice(pos, 0, isExist);
          }
        }
        // else if(fIndex!=1){
        //   schema.columns.splice(fIndex,1);
        //   schema.columns.splice(1,0,isExist);
        // }
        isExist.onRender = (item, index) => {
          return (
            <IconButton
              className="list-ms-icon"
              onMenuClick={() => {
                if (this.selection.getSelectedIndices()[0] !== index)
                  this.selection.setIndexSelected(index, true);
              }}
              split={true}
              iconProps={{ iconName: "MoreVertical" }}
              menuProps={{
                directionalHint: DirectionalHint.bottomLeftEdge,
                items: this.filteredItems.map(x => ({
                  key: x.key,
                  text: x.name,
                  iconProps: x.iconProps,
                  onClick: (e) => this.commandbarItemClicks(x, schema)
                }))
              }}
            />
          );
        };
      }
    }
    let columnLink = filter(schema.columns, { showAsLink: true });

    if (!isUndefined(columnLink)) {
      columnLink.forEach(columnItem => {
        if (columnItem?.showLinkAction && !isEmpty(columnItem.showLinkAction)) {
          var editAction;
          this.filterCommandBars();
          if (columnItem.showLinkAction) {
            editAction = schema.commandBarItems.filter(
              i => columnItem.showLinkAction === i.key
              // || i.componentAction.toLowerCase().indexOf(columnLink.showLinkAction.toLowerCase()) !== -1
            );
          }
          else if (columnItem.componentLinkAction) {
            editAction = schema.commandBarItems.filter(
              i => columnItem.componentLinkAction === i.componentAction
            );
          }
          else {
            editAction = this.newCommandBarItems.length ? this.newCommandBarItems : schema.commandBarItems;
          }
          if (!isUndefined(editAction) && editAction.length > 0) {

            columnItem.onRender = (item, index) => {
              const plainCardProps = {
                ...this.state.plainCardProps,
                renderData: item
              };
              let fieldContent = this.getFormattedDate(item, columnItem);
              if (columnItem.componentLinkAction) {
                let tempAction = editAction.filter(
                  i => i.filterRuleSet.rules[0].value === item[columnItem.key]
                )
                return (
                  <Link
                    onClick={(e) =>
                      this.commandbarItemClicks(tempAction[0], schema, index, item)
                    }
                    className="linkStyle"
                  >
                    {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                    {columnItem.hasHovercard === true ? (
                      <HoverCard
                        cardOpenDelay={500}
                        plainCardProps={plainCardProps}
                        instantOpenOnClick={true}
                        type={HoverCardType.plain}
                      >
                        {fieldContent}
                      </HoverCard>
                    ) : (
                        <>{fieldContent}</>
                      )}

                  </Link>
                )
              }
              else {
                return (
                  <Link
                    onClick={(e) =>
                      this.commandbarItemClicks(editAction[0], schema, index, item)
                    }
                    className="linkStyle"
                  >
                    {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                    {columnItem.hasHovercard === true ? (
                      <HoverCard
                        cardOpenDelay={500}
                        plainCardProps={plainCardProps}
                        instantOpenOnClick={true}
                        type={HoverCardType.plain}
                      >
                        {fieldContent}
                      </HoverCard>
                    ) : (
                        <>{fieldContent}</>
                      )}
                  </Link>
                );
              }
            };
          } else {
            columnItem.onRender = (item, index) => {
              let fieldContent = this.getFormattedDate(item, columnItem);
              return (
                <Link className="linkStyle">
                  {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                  {fieldContent}
                </Link>
              );
            };
          }
        }
        else if (columnItem.componentLinkAction) {
          editAction = schema.commandBarItems.filter(
            i => columnItem.componentLinkAction === i.componentAction
          );
          if (!isUndefined(editAction) && editAction.length > 0) {
            ctrl = this;
            columnItem.onRender = (item, index) => {
              let fieldContent = this.getFormattedDate(item, columnItem);
              if (columnItem.componentLinkAction) {
                let type = item["REQUESTTYPE"] ? item["REQUESTTYPE"] : item["TYPE"]
                let tempAction = [];
                tempAction = editAction.filter(i => {
                  return i.filterRuleSet?.rules &&
                    i.filterRuleSet?.rules.length &&
                    i.filterRuleSet?.rules[0]?.value.includes(type)
                })
                return (
                  <Link
                    onClick={(e) =>
                      this.commandbarItemClicks(tempAction[0], schema, index, item)
                    }
                    className="linkStyle"
                  >
                    {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                    {fieldContent}
                  </Link>
                )
              } else {
                columnItem.onRender = (item, index) => {
                  let fieldContent = this.getFormattedDate(item, columnItem);
                  return (
                    <Link className="linkStyle">
                      {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                      {fieldContent}
                    </Link>
                  );
                };
              }
            };
          }
        }
        else {
          let editTableAction = schema.commandBarItems.filter(
            i => i.componentAction === "editTable"
          );
          let editAction = undefined;
          if (editTableAction.length > 0) {
            editAction = editTableAction;
          } else {
            editAction = schema.commandBarItems.filter(
              i => i.componentAction === "viewTable"
            )
          }
          if (!isUndefined(editAction) && editAction.length > 0) {
            ctrl = this;
            columnItem.onRender = (item, index) => {
              let fieldContent = this.getFormattedDate(item, columnItem);
              return (
                <Link
                  onClick={(e) => {
                    this.selection.setIndexSelected(index, true);
                    this.getFilteredCommandBarItems();
                    this.commandbarItemClicks(ctrl.newCommandBarItems?.length === 1 ? ctrl.newCommandBarItems[0] : editAction[0], schema, index, item)
                  }}
                  className="linkStyle"
                >
                  {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                  {fieldContent}
                </Link>
              );
            };
          } else
            columnItem.onRender = (item, index) => {
              let fieldContent = this.getFormattedDate(item, columnItem);
              return (
                <Link className="linkStyle">
                  {this.getIcon(schema.iconItems, columnItem, item[columnItem.key])}
                  {fieldContent}
                </Link>
              );
            };
        }
      })
    }
    ctrl2 = this;
    schema.exportData = (tableHeader, schema, sortData) => {
      this.exportData(tableHeader, schema, sortData)
    };
    if (schema.componentName === "TableListComponent") {
      schema.isDataLoad = this.props.formJSON?.isDataLoad;
      schema.groupBySortType = schema.groupBySortType ? schema.groupBySortType : this.state.groupBySortType;
      if (schema.isInfiniteScroll === true) {
        schema.rows = schema.items ? schema.items : this.state.items;
      } else {
        schema.items = this.props.tableDataInput[schema.entityValue];
      }
      schema.entityValue = schema.entityValue
        ? schema.entityValue
        : this.state.entityValue;
      schema.entityDestination = schema.entityDestination
        ? schema.entityDestination
        : this.state.entityDestination;
      schema.columns = schema.columnItems
        ? schema.columnItems
        : this.state.columns;
      schema.getDistinctData = schema.getDistinctData
        ? schema.getDistinctData
        : this.state.getDistinctData

      schema.items = schema.items ? schema.items : this.state.items;
      schema.commandBarItems = schema.commandBarItems
        ? schema.commandBarItems
        : this.state.commandBarItems;

      schema.commandBarItems.forEach(x => {
        if (x.componentAction === "Export") {
          // x.subMenuProps = {
          //   items: [
          //     {
          //       key: "ExportAsCSV",
          //       text: "Export as CSV",
          //       onClick: () => {
          //         this.exportData()
          //         //this.commandbarItemClicks(x, schema)
          //       }
          //     }
          //   ]
          // }
        } else {
          x.onClick = (e) => {
            this.commandbarItemClicks(x, schema);
          };
        }
      });
      schema.deleteAction = this.deleteAction;
      if (!this.props.schema.doNotLoadData)
        schema.getData = this.getData;
      if (schema.entityDestination) {
        schema.selectedItems = cloneDeep(
          this.props.tableDataInput[schema.entityDestination]
        );
      }
      schema.updatedItems = (
        selectionList,
        entityDestinationName = null,
        sourceColumns = null
      ) => {
        if (entityDestinationName !== null) {
          let sourceColumnsList = {};
          let saveSelectionList = [];
          sourceColumns.forEach(x => {
            sourceColumnsList[x.destinationFieldName] = x.fieldName;
          });
          let dbData = cloneDeep(
            this.props.dataTableFromDatabase[entityDestinationName]
          );
          var uniqueProperties = {};
          var uniqueProperty = filter(
            this.props.tableDataInput[`${entityDestinationName}_UniqueArray`],
            function (o) {
              return o.isUnique;
            }
          );
          dbData &&
            dbData.forEach(item => {
              uniqueProperty.map(x => {
                uniqueProperties[x.fieldName] = item[x.fieldName];
                return uniqueProperties[x.fieldName];
              });
              let tableIndex = findIndex(selectionList, uniqueProperties);
              if (tableIndex === -1) {
                item.DELETED = true;
                item.isModified = true;
                saveSelectionList.push(item);
              } else saveSelectionList.push(item);
            });
          forEach(selectionList, item => {
            uniqueProperty.map(x => {
              uniqueProperties[x.fieldName] = item[x.fieldName];
              return uniqueProperties[x.fieldName];
            });
            let tableIndex = findIndex(dbData, uniqueProperties);
            if (tableIndex === -1) {
              delete item.VFUUID;
              item.isModified = true;
              saveSelectionList.push(item);
            }
          });
          this.props.saveDataForm({
            [entityDestinationName]: saveSelectionList
          });
          /* this.props.tableDataForm(
            entityDestinationName,
            dbData,
            ""
          );  */
        }
      };
      schema.selection = this.selection;
      schema.dragDrop = schema.dragDrop ? schema.dragDrop : false;
      schema.groups = schema.groupBy ? this.groupedItems(schema.items) : null;

      schema.dispalyContent = true;
      schema.headerScrollable = true;
      schema.onRenderDetailsHeader = true;
      // schema.isInfiniteScroll = schema.isInfiniteScroll;
      // schema.compact = schema.compact;
      schema.filterContext = this.props.formJSON?.applyContext;
      listElement = React.createElement(
        controlModule.default ? controlModule.default : controlModule,
        schema
      );
    } else if (schema.componentName === "TableSearchComponent") {
      schema.isDataLoad = this.props.formJSON?.isDataLoad;
      schema.groupBySortType = schema.groupBySortType ? schema.groupBySortType : this.state.groupBySortType;
      schema.entityValue = schema.entityValue
        ? schema.entityValue
        : this.state.entityValue;
      schema.dragDrop = schema.dragDrop ? schema.dragDrop : false;
      schema.columns = schema.columnItems
        ? schema.columnItems
        : this.state.columns;
      schema.items = schema.items ? schema.items : this.state.items;
      schema.selection = this.selection;
      schema.groups = schema.groupBy ? this.groupedItems(schema.items) : null;
      schema.selectedItems = this.state.items;
      schema.updatedItems = () => {
        this.props.setData(this.state.schema.entityValue, this.state.items);
      };
      if (!this.props.schema.doNotLoadData)
        schema.getData = this.getData;
      schema.isScrolllist = true;
      //schema.isInfiniteScroll = schema.isInfiniteScroll;
      //schema.compact = schema.compact;
      if (schema.isInfiniteScroll === true) {
        schema.rows = schema.items ? schema.items : this.state.items;
      }
      schema.isFilter = true;
      let isdefaultSorting = find(schema.columns, { defaultSorting: true });
      schema.pagination = {
        limit: 100,
        order: [
          [
            isdefaultSorting
              ? isdefaultSorting.fieldName
              : schema.columns[0].fieldName,
            isdefaultSorting?.columnSortType ? isdefaultSorting.columnSortType.toUpperCase() : "ASC"
          ]
        ]
      };
      schema.filterContext = this.props.formJSON?.applyContext;
      listElement = React.createElement(
        controlModule.default ? controlModule.default : controlModule,
        schema
      );
    } else if (schema.componentName === "TableAddAndSearchComponent") {
      schema.isDataLoad = this.props.formJSON?.isDataLoad;
      schema.groupBySortType = schema.groupBySortType ? schema.groupBySortType : this.state.groupBySortType;
      if (schema.isInfiniteScroll === true) {
        schema.rows = schema.items ? schema.items : this.state.items;
      } else {
        schema.items =
          this.props.tableDataInput[schema.entityValue] || schema.items;
      }
      // schema.isInfiniteScroll = schema.isInfiniteScroll;
      // schema.compact = schema.compact;
      schema.entityValue = schema.entityValue
        ? schema.entityValue
        : this.state.entityValue;
      schema.entityDestination = schema.entityDestination
        ? schema.entityDestination
        : this.state.entityDestination;
      schema.columns = schema.columnItems
        ? schema.columnItems
        : this.state.columns;

      schema.items = schema.items ? schema.items : this.state.items;
      schema.commandBarItems = schema.commandBarItems
        ? schema.commandBarItems
        : this.state.commandBarItems;

      schema.commandBarItems.forEach(x => {
        if (x.componentAction === "Export") {
          // x.subMenuProps = {
          //   items: [
          //     {
          //       key: "ExportAsCSV",
          //       text: "Export as CSV",
          //       onClick: () => {
          //         this.exportData()
          //         //this.commandbarItemClicks(x, schema)
          //       }
          //     }
          //   ]
          // }
        } else {
          x.onClick = (e) => {
            this.commandbarItemClicks(x, schema);
          };
        }
      });
      schema.selection = this.selection;
      schema.dragDrop = schema.dragDrop ? schema.dragDrop : false;
      schema.groups = schema.groupBy ? this.groupedItems(schema.items) : null;

      schema.dispalyContent = true;
      schema.headerScrollable = true;
      schema.onRenderDetailsHeader = true;
      let isdefaultSorting = find(schema.columns, { defaultSorting: true });
      schema.pagination = {
        limit: 100,
        order: [
          [
            isdefaultSorting
              ? isdefaultSorting.fieldName
              : schema.columns[0].fieldName,
            isdefaultSorting?.columnSortType ? isdefaultSorting.columnSortType.toUpperCase() : "ASC"
          ]
        ]
      };
      schema.isScrolllist = false;
      if (schema.isInfiniteScroll === true) {
        schema.rows = schema.items ? schema.items : this.state.items;
      }
      schema.updatedItems = (
        selectionList,
        entityDestinationName = null,
        sourceColumns = null
      ) => {
        if (entityDestinationName !== null && schema.trackSelection === true) {
          selectionList.forEach(item => {
            if (item) item.isModified = true;
          });

          this.props.saveDataForm({
            [entityDestinationName]: selectionList
          });

          this.props.tableDataForm(
            entityDestinationName,
            selectionList,
            "addTableSave"
          );
          setTimeout(() => {
            this.props.onSetWizardComponent({ "runTableMandatory": true })
          }, 100);
        }
        this.setState({ selectionData: selectionList });
      };
      /*   schema.updatedItems = data => {
        this.setState({ selectionData: data });
      }; */
      if (!this.props.schema.doNotLoadData)
        schema.getData = this.getData;
      schema.filterContext = this.props.formJSON?.applyContext;
      listElement = React.createElement(
        controlModule.default ? controlModule.default : controlModule,
        schema
      );
    } else {
      schema.id = schema.uniqueId;
      listElement = React.createElement(
        controlModule.default ? controlModule.default : controlModule,
        schema
      );
    }

    let isFinishEnable = this.finishButtonValidation();

    return (
      <div
        className="dragfieldcomponent"
        onClick={e => {
          if (this.props.setPropertyWindow) this.onClickControl(e);
        }}
        id={this.props.id}
      >
        {!(this.props.hideEditIcon === true) ? (
          <div className="drag-here" id={"drop" + this.props.id}>
            <i className="ms-Icon ms-Icon--Add" aria-hidden="true"></i>
          </div>
        ) : (
            ""
          )}
        <div className="fb-action list-render-action">
          {!(this.props.hideEditIcon === true) && (
            <>
              <IconButton
                id={"fb-actionid-2"}
                className="ms-icon"
                iconProps={{ iconName: "Delete" }}
                styles={{ root: { paddingBottom: '10px' } }}
                onClick={(e) => this.props.deleteControl(this.props.id)}
                title={this.trans("Delete")}
                ariaLabel={this.trans("Delete")}
              />
              <IconButton
                id={"fb-actionid-1"}
                className="ms-icon"
                iconProps={{ iconName: "Copy" }}
                styles={{ root: { paddingBottom: '10px' } }}
                title={this.trans("Copy")}
                ariaLabel={this.trans("Copy")}
              />
              <IconButton
                id={"fb-actionid"}
                className="ms-icon"
                iconProps={{ iconName: "Edit" }}
                styles={{ root: { paddingBottom: '10px' } }}
                onClick={(e) => this.setPropertyWindow()}
                title={this.trans("Edit")}
                ariaLabel={this.trans("Edit")}
              />
            </>
          )}
        </div>
        {listElement}

        {showlistPropertyWindow === true ? (
          <VFListPropertyWindow
            showlistPanel={this.state.showlistPanel}
            hidePanel={this.hidePanel}
            setData={this.setStateData}
            setSchemaData={this.setSchemaData}
            stateData={this.state}
            componentName={componentName}
            schema={schema}
            entityValue={this.state.entityValue}
            commandbarPanel={this.commandbarPanel}
            setFormJson={this.props.setFormJson}
            editId={this.props.editId}
            selectedIndex={this.state.selectedIndex}
          />
        ) : (
            ""
          )}
        {/* {showTopTileWindow === true ? (
          <TopTilesProperty
            controlSchema={this.state.controlSchema}
            setSchemaData={this.setSchemaData}
            schema={schema}
            setData={this.setStateData}
            entityOption={this.state.tileEntityOption}
            cancleBtn={this.hidePanel}
            //updateTopTiles={this.updateTopTiles}
            isTopTiles={this.state.ShowTopTile}
          />
        ) : null} */}
        {this.state.showAlertBox && this.state.displayType === "Error" ? (
          <DialogBoxComponent
            hidden={!showAlertBox}
            title={this.state.title}
            type={this.state.displayType}
            subText={this.state.subText}
            saveButtonAriaLabel={saveBtnText}
            onClick={this.onAlertBoxRefreshDismiss}
            onDismiss={this.onAlertBoxRefreshDismiss}
          >
          </DialogBoxComponent>
        ) : ""}
        {showDialogBox ? (
          <DialogBoxComponent
            hidden={!showDialogBox}
            title={confirmationTittle}
            closeButtonAriaLabel={closeBtnText}
            saveButtonAriaLabel={saveBtnText}
            subText={confirmationContent}
            onClick={this.state.showWarning ? this.onDialogBoxDismiss : (e) => { this.deleteAction("", schema, itemSelected) }}
            onDismiss={this.onDialogBoxDismiss}
            restrictCloseButton={!this.state.showWarning ? true : false}
            entityValue={this.props.schema.entityValue}
          />
        ) : ""}
        {this.state.isOverlay ? (
          <div className="overlay dialog-Overlay">
            <ProgressIndicator
              progressHidden={!this.state.isOverlay}
              barHeight={5}
              ariaValueText="Loading..."
            />
          </div>
        ) : ""}
        {showPanel && !isExport ? (
          <PanelComponent
            headerTitle={this.props.currentRequestNav
              && this.props.currentRequestNav.navigationFormHeader
              && (this.props.panelActionArray[this.props.panelActionArray.length - 1] === "Navigate")
              ? this.props.currentRequestNav.navigationFormHeader : this.state.commandbarTittle}
            className="normal-panel"
            isOpen={this.state.showPanel}
            onDismiss={this.closePanel}
            panelType={
              this.state.commandbarActionType === "historyTable" ? 4 : panelType
            }
            customTextInPixel={panelType === 7 ? customTextInPixel : undefined}
            onRenderHeader={() => this.panelHeader(schema)}
            onRenderFooterContent={
              this.state.commandBarItems ? this.onTabFooterContent : ""
            }
            id={panelType === 4 ? "first-lvl-panel" : "sec-lvl-panel"}
          >
            {this.state.isBtnDisabled ? (
              <div className="overlay">
                <ProgressIndicator
                  progressHidden={!this.state.isBtnDisabled}
                  barHeight={5}
                  ariaValueText="Loading..."
                />
              </div>
            ) : null}
            {this.props.successMessage.panel ? (
              <MessageBarComponent
                MessageBarType={this.props.successMessage.isError ? MessageBarType.error : MessageBarType.success}
                restrictAutoClose={this.props.successMessage.isError}
                Multiline={false}
                onDismiss={this.closeMessageBar}
                dismissButtonAriaLabel={this.trans("Close")}
              >
                {this.props.successMessage.message}
              </MessageBarComponent>
            ) : ""}
            {panelElement}
          </PanelComponent>
        ) : ""}
        {showNavigationPanel ? (
          <PanelComponent
            headerTitle={this.state.commandbarTittle}
            className="normal-panel normal-panel-sub1"
            isOpen={this.state.showNavigationPanel}
            onDismiss={this.closeNavigationPanel}
            panelType={panelType}
            customTextInPixel={panelType === 7 ? customTextInPixel : undefined}
            onRenderHeader={() => this.panelHeader(schema, true)}
            onRenderFooterContent={this.onNavigationFooter}
            id="sec-lev-panel"
          >
            {this.props.successMessage.panel && (
              <MessageBarComponent
                MessageBarType={MessageBarType.error}
                Multiline={false}
                onDismiss={this.closeMessageBar}
                dismissButtonAriaLabel={this.trans("Close")}
              >
                {this.props.successMessage.message}
              </MessageBarComponent>
            )}
            {panelElement}
          </PanelComponent>
        ) : ""}
        {(this.displayType === "alert" || this.displayType === "formPanel") ? (
          <DialogBoxComponent
            hidden={!showAlertBox}
            title={this.state.commandbarTittle}
            saveButtonAriaLabel={saveBtnText}
            closeButtonAriaLabel={closeBtnText}
            type={type}
            onClick={(e) => { this.saveData("", schema, itemSelected) }}
            onDismiss={this.onAlertDialogBoxDismiss}
            validButtons={isFinishEnable}
          >
            {panelElement}
          </DialogBoxComponent>
        ) : ""}
        {isExport ? (<DialogBoxComponent
          hidden={!showExportDialog}
          title={this.state.commandbarTittle}
          saveButtonAriaLabel={saveBtnText}
          closeButtonAriaLabel={closeBtnText}
          type={"export"}
          onDismiss={this.onAlertDialogBoxDismiss}
          validButtons={isFinishEnable}
          exportElement={exportElement}
          onClick={(e) => {
            this.exportData()
          }}
        >
        </DialogBoxComponent>) : ""}
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
    allStates: state.VFFormReducer.allStates,
    stateByForm: state.VFFormReducer.stateByForm,
    saveDataInput: state.VFFormReducer.saveDataForm,
    tableDataInput: state.VFFormReducer.tableDataForm,
    tabStateByForm: state.VFFormReducer.tabStateByForm,
    currentOperation: state.VFFormReducer.currentOperation,
    totalTabValidations: state.VFFormReducer.tabValidataions,
    dataTableFromDatabase: state.VFFormReducer.dataFromDatabase,
    successMessage: state.VFFormReducer.successMessage,
    currentRequestNav: state.VFFormReducer.currentRequestNav,
    tabListData: state.VFFormReducer.tabListData,
    isAccordian: state.VFFormReducer.isAccordian,
    currentTabOperation: state.VFFormReducer.currentTabOperation,
    dropdownSelectionInput: state.VFFormReducer.dropdownSelection,
    topTilesSelection: state.VFFormReducer.topTilesSelection,
    accordianDetails: state.VFFormReducer.accordianDetails,
    headerInfo: state.VFFormReducer.headerInfo,
    childFormValidation: state.VFFormReducer.childFormValidation,
    utilityData: state.VFFormReducer.utilData,
    forceRefreshList: state.VFFormReducer.forceRefreshList,
    totalTabValidationIsValid: state.VFFormReducer.tabValidataions.isValid,
    panelActionArray: state.VFFormReducer.panelActionArray,
    validationArray: state.VFFormReducer.validationArray
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onSetWizardComponent: isWizardComp =>
      dispatch(onSetWizardComponent(isWizardComp)),
    onSetStateByForm: stateByForm => dispatch(onSetStateByForm(stateByForm)),
    saveDataForm: (stateByForm, operation = null, value = null, index = null) =>
      dispatch(saveDataForm(stateByForm, operation, value, index)),
    tableDataForm: (
      entityType,
      items = null,
      index = null,
      operation = null,
      columns = []
    ) => dispatch(tableDataForm(entityType, items, index, operation, columns)),
    clearDataForm: (entityType = null, operation = null) =>
      dispatch(clearDataForm(entityType, operation)),
    setSaveCurrentOperation: (type, status) =>
      dispatch(saveCurrentOperation(type, status)),
    updateLog: (key, value) => dispatch(updateLog(key)),
    onResetAllState: () => dispatch(onResetAllState()),
    onTabStateByForm: (formIndex, operation, value) =>
      dispatch(onTabStateByForm(formIndex, operation, value)),
    dataFromDatabase: (entity, data) =>
      dispatch(dataFromDatabase(entity, data)),
    // setValidations: (entity, validations, actionType) =>
    //   dispatch(setValidations(entity, validations, actionType)),
    setTabValidations: (validations, actionType) =>
      dispatch(setTabValidations(validations, actionType)),
    setSuccessMessage: (isSuccess, message, panel, isError, isInfo) =>
      dispatch(setSuccessMessage(isSuccess, message, panel, isError, isInfo)),
    updateTabIndex: (flag, value, isTab = null) =>
      dispatch(updateTabIndex(flag, value, isTab)),
    onResetMultiselect: (entityValue, destinationEntity) =>
      dispatch(onResetMultiselect(entityValue, destinationEntity)),
    dropdownSelection: (dataBinding, operation = null, value = null) =>
      dispatch(dropdownSelection(dataBinding, operation, value)),
    setHeaderInfo: (value = null) => dispatch(setHeaderInfo(value)),
    setConditionName: (key, value) => dispatch(setConditionName(key, value)),
    setUtilData: (key, value) =>
      dispatch(setUtilData(key, value)),
  };
};

// export default connect(mapStateToProps, mapDispatchToProps)(VFListRender);
export default withTranslation()(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(VFListRender)
  ));
