import React, { useEffect, useState } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Item from './Item';
import { v4 as uuidv4 } from 'uuid';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import CloseIcon from '@material-ui/icons/Close';
import ExpandIcon from '@material-ui/icons/KeyboardArrowRight';
import CollapseIcon from '@material-ui/icons/KeyboardArrowDown';
import AddIcon from '@material-ui/icons/Add';
import { getTextColor } from './Methods.jsx';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  buttonLight: {
    color: 'white',
  },
  buttonDark: {
    color: 'black',
  },
}));

function ItemList(props) {
  const classes = useStyles();

  return (
    <Draggable
      type="CATEGORY"
      draggableId={props.category.title}
      key={props.category.title}
      index={props.categoryIndex}
    >
      {(provided, _) => {
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              width: '100%',
              height: 'max-content',
              ...provided.draggableProps.style,
            }}
          >
            <div
              {...provided.dragHandleProps}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                userSelect: 'none',
                backgroundColor: props.category.color || '#D1D1D1',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 'max-content',
                  height: 'max-content',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 8,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    props.setCollapse(
                      props.category.title,
                      !props.category.collapse
                    );
                  }}
                  className={
                    getTextColor(props.category.color || '#D1D1D1', true)
                      ? classes.buttonDark
                      : classes.buttonLight
                  }
                >
                  {props.category.collapse ? <ExpandIcon /> : <CollapseIcon />}
                </IconButton>

                <IconButton
                  size="small"
                  onClick={() => {
                    props.requestCreate(props.category.title);
                  }}
                  className={
                    getTextColor(props.category.color || '#D1D1D1', true)
                      ? classes.buttonDark
                      : classes.buttonLight
                  }
                >
                  <AddIcon />
                </IconButton>
              </div>

              <div
                style={{
                  height: '100%',
                  width: '100%',
                  textAlign: 'left',
                  fontSize: '15px',
                  padding: 5,
                  color: getTextColor(props.category.color || '#D1D1D1'),
                }}
              >
                {props.category.title}
              </div>

              <div
                style={{
                  width: 'max-content',
                  height: 'max-content',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row-reverse',
                  padding: 8,
                }}
              >
                <IconButton
                  size="small"
                  onClick={() => {
                    props.onClose(props.category.title, null);
                  }}
                  className={
                    getTextColor(props.category.color || '#D1D1D1', true)
                      ? classes.buttonDark
                      : classes.buttonLight
                  }
                >
                  <CloseIcon />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={() => {
                    props.requestEdit(props.category.title, null);
                  }}
                  className={
                    getTextColor(props.category.color || '#D1D1D1', true)
                      ? classes.buttonDark
                      : classes.buttonLight
                  }
                >
                  <EditIcon />
                </IconButton>
              </div>
            </div>

            <Droppable
              type="ITEM"
              droppableId={props.category.title}
              isDropDisabled={props.category.collapse}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  style={{
                    width: '492px',
                    padding: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {!props.category.collapse &&
                    props.category.items.map((item, itemIndex) => {
                      return (
                        <Item
                          key={uuidv4()}
                          id={props.uuid}
                          item={item}
                          itemIndex={itemIndex}
                          onInterval={props.onInterval}
                          onClose={() => {
                            props.onClose(props.category.title, item.name);
                          }}
                          requestEdit={() => {
                            props.requestEdit(props.category.title, item.name);
                          }}
                        />
                      );
                    })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {provided.placeholder}
          </div>
        );
      }}
    </Draggable>
  );
}

export default ItemList;
