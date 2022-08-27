import React, { Component } from 'react';
import CreateMenu from '../../containers/CreateMenu Copy';
import Item from '../../containers/Item';
import IconButton from '@material-ui/core/IconButton';
import DownloadIcon from '@material-ui/icons/GetApp';
import UploadIcon from '@material-ui/icons/Publish';
import AddIcon from '@material-ui/icons/Add';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { v4 as uuidv4 } from 'uuid';
// import './Popup.css';
// import Dropdown from 'react-dropdown';
// import 'react-dropdown/style.css';

// categories

const SortableItem = SortableElement(({ value }) => {
  let self = value.self;
  return (
    <Item
      id={uuidv4()}
      item={value.value}
      onClose={() => {
        self.clearIntervals();
        self.delete(value.index);
      }}
      onEdit={() => {
        self.requestEdit(value.index);
      }}
      onInterval={(id) => {
        self.intervals.push(id);
      }}
    />
  );
});

const SortableList = SortableContainer(({ items }) => {
  return (
    <div
      style={{
        width: '95%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {items.items.map((value, index) => (
        <SortableItem
          index={index}
          value={{
            value: value,
            index: index,
            self: items.self,
          }}
        />
      ))}
    </div>
  );
});

class Popup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: [],
      creating: false,
      appending: false,
      editing: -1,
      over: -1,
    };

    this.intervals = [];
    this.fileInput = React.createRef(null);

    this.loadItems();

    chrome.runtime.sendMessage({ items: localStorage.getItem('items') });
  }

  downloadData() {
    var href =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(this.state.items));

    const link = document.createElement('a');
    link.href = href;
    link.download = 'file.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  uploadData(event) {
    let files = Array.from(event.target.files);
    let json = files.find((file) => file.type == 'application/json');
    if (json == undefined) return;

    let reader = new FileReader();
    reader.readAsText(json);
    reader.onloadend = () => {
      localStorage.setItem('items', reader.result);
      this.loadItems(true);
    };
  }

  openFileDialog() {
    this.fileInput.current.click();
  }

  loadItems(set = false) {
    if (
      localStorage.getItem('items') == null ||
      localStorage.getItem('items') == ''
    ) {
      localStorage.setItem('items', JSON.stringify([]));
      console.log('Initialized data');
    } else {
      let items = JSON.parse(localStorage.getItem('items'));
      console.log(localStorage.getItem('items'));

      items = items.map((item) => {
        if (item.type == 'interval') {
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
        } else {
          return {
            name: item.name,
            type: item.type,
            data: new Date(Date.parse(item.data)),
            color: item.color,
          };
        }
      });

      if (!set) {
        this.state = { ...this.state, items: items };
        console.log('Loaded data');
      } else {
        this.setState({ ...this.state, items: items }, () => {
          console.log('Loaded data');
        });
      }
    }
  }

  saveItems() {
    let data = JSON.stringify(this.state.items);

    chrome.runtime.sendMessage({ items: data });
    localStorage.setItem('items', data);

    console.log('Saved data');
  }

  onCancel() {
    this.setState({
      ...this.state,
      creating: false,
      editing: -1,
    });
  }

  onCreate(result) {
    if (this.state.appending) {
      this.setState(
        {
          ...this.state,
          items: [result].concat(this.state.items),
          creating: false,
          appending: false,
        },
        () => {
          this.saveItems();
        }
      );
      return;
    }

    if (this.state.editing > -1) {
      let items = this.state.items;
      items[this.state.editing] = result;

      this.setState(
        {
          ...this.state,
          items: items,
          creating: false,
          editing: -1,
        },
        () => {
          this.saveItems();
        }
      );
      return;
    }
  }

  requestAppend() {
    this.setState({
      ...this.state,
      creating: true,
      appending: true,
    });
  }
  requestEdit(index) {
    this.setState({
      ...this.state,
      creating: true,
      editing: index,
    });
  }

  delete(index) {
    let items = this.state.items;
    items.splice(index, 1);
    this.setState(
      {
        ...this.state,
        items: items,
      },
      () => {
        this.saveItems();
      }
    );
  }

  clearIntervals() {
    this.intervals.map((interval) => clearInterval(interval));
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    console.log(this.state.items);
    this.setState(
      {
        ...this.state,
        items: arrayMove(this.state.items, oldIndex, newIndex),
      },
      this.saveItems
    );
  };

  render() {
    return (
      <div>
        <input
          onChange={this.uploadData.bind(this)}
          ref={this.fileInput}
          type="file"
          style={{
            display: 'none',
          }}
        ></input>
        <div
          style={{
            marginTop: 60,
            padding: 10,
            display: this.state.creating ? 'none' : 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SortableList
            items={{
              items: this.state.items,
              self: this,
            }}
            distance={1}
            pressDelay={0}
            axis="y"
            onSortEnd={this.onSortEnd}
          />
        </div>

        <CreateMenu
          id={uuidv4()}
          onCreate={this.onCreate.bind(this)}
          onCancel={this.onCancel.bind(this)}
          disabled={!this.state.creating}
          item={
            this.state.editing > -1
              ? this.state.items[this.state.editing]
              : undefined
          }
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
              width: '165px',
              // width: 'max-content',
              height: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <div
              style={{
                width: 'max-content',
                height: 'max-content',
                backgroundColor: '#D1D1D1',
                borderRadius: '48px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'all',
              }}
            >
              <IconButton onClick={this.downloadData.bind(this)}>
                <DownloadIcon />
              </IconButton>
            </div>
            <div
              style={{
                width: 'max-content',
                height: 'max-content',
                backgroundColor: '#D1D1D1',
                borderRadius: '48px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'all',
              }}
            >
              <IconButton onClick={this.requestAppend.bind(this)}>
                <AddIcon />
              </IconButton>
            </div>

            <div
              style={{
                width: 'max-content',
                height: 'max-content',
                backgroundColor: '#D1D1D1',
                borderRadius: '48px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: 'all',
              }}
            >
              <IconButton onClick={this.openFileDialog.bind(this)}>
                <UploadIcon />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Popup;
