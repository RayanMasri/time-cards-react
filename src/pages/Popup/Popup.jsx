import React, { Component } from 'react';
import StyledIconButton from '../../containers/StyledIconButton';
import CreateMenu from '../../containers/CreateMenu';
import ItemList from '../../containers/ItemList';
import DownloadIcon from '@material-ui/icons/GetApp';
import UploadIcon from '@material-ui/icons/Publish';
import AddIcon from '@material-ui/icons/Add';
import arrayMove from 'array-move';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import './Popup.css';

// images to describe categories or items
// implement virtual lists for faster sorting https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/patterns/virtual-lists.md
// settings page
// localiztion support for arabic, english

class Popup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      collapsed: [],
      creating: {
        status: false,
        category: -1,
      },
      editing: {
        status: false,
        category: { index: -1 },
        item: { index: -1 },
      },
    };
    this.intervals = [];
    this.fileInput = React.createRef(null);

    this.requestCreate = this.requestCreate.bind(this);
    this.loadItems();
  }

  isStringValid(name, exception = null) {
    if (name == '' || name == null) return false;

    let match = false;

    if (exception != null) {
      if (exception.category) {
        match = this.state.data.find(
          (category) =>
            category.items.find((item) => item.name == name) != undefined ||
            (category.title == name && category.title != exception.name)
        );
      } else {
        match = this.state.data.find(
          (category) =>
            category.items.find(
              (item) => item.name == name && item.name != exception.name
            ) != undefined || category.title == name
        );
      }
    } else {
      match = this.state.data.find(
        (category) =>
          category.items.find((item) => item.name == name) != undefined ||
          category.title == name
      );
    }

    return !match;
  }

  downloadData() {
    var href =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(this.state.data));

    const link = document.createElement('a');
    link.href = href;
    link.download = 'data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    chrome.runtime.sendMessage({ type: 'download' });
  }

  uploadData(event) {
    let files = Array.from(event.target.files);
    let json = files.find((file) => file.type == 'application/json');
    if (json == undefined) return;

    let reader = new FileReader();

    reader.onload = () => {
      this.saveItems(JSON.parse(reader.result));
      this.loadItems();
    };

    reader.readAsText(json);
  }

  openFileDialog() {
    this.fileInput.current.click();
  }

  loadItems() {
    chrome.runtime.sendMessage({ type: 'load' }, (data) => {
      if (!data) return;

      data = data.map((category) => {
        return {
          collapse: category.collapse,
          title: category.title,
          color: category.color,
          items: category.items.map((item) => {
            switch (item.type) {
              case 'interval':
                return {
                  name: item.name,
                  type: item.type,
                  data: {
                    days: item.data.days,
                    initial: new Date(Date.parse(item.data.initial)),
                    seen: new Date(Date.now()),
                  },
                  color: item.color,
                };
              case 'standard':
                return {
                  name: item.name,
                  type: item.type,
                  data: new Date(Date.parse(item.data)),
                  color: item.color,
                };
              case 'note':
                return item;
            }
          }),
        };
      });

      this.setState({ ...this.state, data: data }, () => {
        console.log('Loaded data');
      });
    });
  }

  saveItems(object, register = true) {
    chrome.runtime.sendMessage({
      type: 'save',
      items: object,
      register: register,
    });
  }

  setCollapse(id, exp) {
    let data = this.state.data;
    let index = data.findIndex((x) => x.title == id);

    data[index].collapse = exp;

    let collapsed = this.state.collapsed;
    if (exp) {
      collapsed.push(id);
    } else {
      collapsed = collapsed.filter((e) => e != id);
    }

    this.setState(
      {
        ...this.state,
        data: data,
        collapsed: collapsed,
      },
      () => {
        this.saveItems(this.state.data, false);
      }
    );
  }

  onDragEnd(result) {
    if (!result.destination) return;
    let { source, destination } = result;

    let data = this.state.data;

    if (result.type == 'ITEM') {
      if (source.droppableId == destination.droppableId) {
        let categoryIndex = data.findIndex(
          (x) => x.title == source.droppableId
        );

        data[categoryIndex].items = arrayMove(
          data[categoryIndex].items,
          source.index,
          destination.index
        );
      } else {
        let sourceIndex = data.findIndex((x) => x.title == source.droppableId);
        let destinationIndex = data.findIndex(
          (x) => x.title == destination.droppableId
        );

        let [removed] = data[sourceIndex].items.splice(source.index, 1);
        data[destinationIndex].items.splice(destination.index, 0, removed);
      }
    } else {
      data = arrayMove(data, source.index, destination.index);
    }

    this.setState(
      {
        ...this.state,
        data: data,
      },
      () => {
        this.saveItems(this.state.data);
      }
    );
  }

  onClose(categoryName, itemName) {
    let categoryIndex = this.state.data.findIndex(
      (category) => category.title == categoryName
    );

    if (categoryIndex < 0) return;

    let data = this.state.data;

    if (itemName != null) {
      let itemIndex = this.state.data[categoryIndex].items.findIndex(
        (item) => item.name == itemName
      );

      if (itemIndex < 0) return;

      let categoryClone = this.state.data[categoryIndex];
      categoryClone.items.splice(itemIndex, 1);

      data.splice(categoryIndex, 1, categoryClone);
    } else {
      data.splice(categoryIndex, 1);
    }

    this.setState(
      {
        ...this.state,
        data: data,
      },
      () => {
        this.saveItems(this.state.data);
      }
    );
  }

  onCreate(result) {
    let data = this.state.data;

    if (this.state.creating.status) {
      if (this.state.creating.category > -1) {
        // add item
        data[this.state.creating.category].items.unshift(result);
      } else {
        // add category
        data.unshift(result);
      }
    }

    if (this.state.editing.status) {
      if (this.state.editing.item.index < 0) {
        data.splice(this.state.editing.category.index, 1, {
          title: result.title,
          color: result.color,
          items: this.state.editing.category.data.items,
        });
      } else {
        data[this.state.editing.category.index].items.splice(
          this.state.editing.item.index,
          1,
          result
        );
      }
    }

    this.setState(
      {
        ...this.state,
        data: data,
        creating: {
          status: false,
          category: -1,
        },
        editing: {
          status: false,
          category: { index: -1 },
          item: { index: -1 },
        },
      },
      () => {
        this.saveItems(this.state.data);
      }
    );
  }

  onCancel() {
    this.setState({
      ...this.state,
      creating: {
        status: false,
        category: -1,
      },
      editing: {
        status: false,
        category: { index: -1 },
        item: { index: -1 },
      },
    });
  }

  requestCreate(categoryName) {
    if (categoryName != null) {
      this.setState({
        ...this.state,
        creating: {
          status: true,
          category: this.state.data.findIndex(
            (category) => category.title == categoryName
          ),
        },
      });
    } else {
      this.setState({
        ...this.state,
        creating: {
          status: true,
          category: -1,
        },
      });
    }
  }

  requestEdit(categoryName, itemName) {
    let categoryIndex = this.state.data.findIndex(
      (category) => category.title == categoryName
    );

    if (itemName != null) {
      let itemIndex = this.state.data[categoryIndex].items.findIndex(
        (item) => item.name == itemName
      );

      this.setState({
        ...this.state,
        editing: {
          status: true,
          category: {
            index: categoryIndex,
            data: this.state.data[categoryIndex],
          },
          item: {
            index: itemIndex,
            data: this.state.data[categoryIndex].items[itemIndex],
          },
        },
      });
    } else {
      this.setState({
        ...this.state,
        editing: {
          status: true,
          category: {
            index: categoryIndex,
            data: this.state.data[categoryIndex],
          },
          item: { index: -1 },
        },
      });
    }
  }

  render() {
    console.log(this.state);
    return (
      <div>
        <input
          onChange={this.uploadData.bind(this)}
          style={{ display: 'none' }}
          ref={this.fileInput}
          type="file"
        ></input>
        <div
          style={{
            marginTop: 60,
            padding: 10,
            display: this.state.creating.status ? 'none' : 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <DragDropContext onDragEnd={this.onDragEnd.bind(this)}>
            <Droppable type="CATEGORY" droppableId="main">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  style={{
                    width: '512px',
                  }}
                >
                  {this.state.data.map((category, categoryIndex) => {
                    return (
                      <ItemList
                        uuid={uuidv4()}
                        key={uuidv4()}
                        category={category}
                        categoryIndex={categoryIndex}
                        onInterval={(id) => this.intervals.push(id)}
                        onClose={this.onClose.bind(this)}
                        requestEdit={this.requestEdit.bind(this)}
                        requestCreate={this.requestCreate}
                        setCollapse={this.setCollapse.bind(this)}
                      />
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <CreateMenu
          id={uuidv4()}
          onCreate={this.onCreate.bind(this)}
          onCancel={this.onCancel.bind(this)}
          isStringValid={this.isStringValid.bind(this)}
          category={
            (this.state.creating.status && this.state.creating.category < 0) ||
            (this.state.editing.status && this.state.editing.item.index < 0)
          }
          editing={this.state.editing}
          disabled={!this.state.creating.status && !this.state.editing.status}
        />

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
            position: 'fixed',
            top: 10,
            zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '175px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <StyledIconButton onClick={this.downloadData.bind(this)}>
              <DownloadIcon />
            </StyledIconButton>
            <StyledIconButton onClick={() => this.requestCreate(null)}>
              <AddIcon />
            </StyledIconButton>
            <StyledIconButton onClick={this.openFileDialog.bind(this)}>
              <UploadIcon />
            </StyledIconButton>
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;
