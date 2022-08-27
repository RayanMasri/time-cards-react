import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { InputAdornment } from '@material-ui/core';
import { CompactPicker } from 'react-color';
import { format } from './Methods';

const useStyles = makeStyles((theme) => ({
  textField: {
    // '& .MuiInputBase-root': {
    //   color: 'white',
    // },
    '& .MuiFormLabel-root': {
      color: 'white',
    },
  },
}));

function CreateMenu(props) {
  const [state, setState] = useState({
    standard: true,
    sequence: false,
    note: false,
    name: 'Unnamed',
    description: 'No description.',
    time: format(Date.now()),
    interval: '7',
    initial: format(Date.now()),
    color: '#d1d1d1',
  });
  const classes = useStyles();

  const handleColorChange = (event) => {
    setState({
      ...state,
      color: event.hex,
    });
  };

  const handleChange = (event) => {
    if (!event.target.checked) return;

    setState({
      ...state,
      standard: false,
      sequence: false,
      note: false,
      [event.target.name]: event.target.checked,
    });
  };

  const handleFieldChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.value });
  };

  const onSubmit = () => {
    if (
      !props.isStringValid(
        state.name,
        props.editing.status
          ? {
              name:
                props.editing.item.index < 0
                  ? props.editing.category.data.title
                  : props.editing.item.data.name,
              category: props.editing.item.index < 0,
            }
          : null
      )
    )
      return;

    if (props.category) {
      props.onCreate({
        collapse: false,
        title: state.name,
        color: state.color,
        items: [],
      });
      return;
    }

    if (state.standard && state.time != '') {
      let date = new Date(Date.parse(state.time));
      if (!isNaN(date.getTime())) {
        props.onCreate({
          name: state.name,
          data: date,
          color: state.color,
          type: 'standard',
        });
      }
      return;
    }

    if (state.sequence && state.interval != '' && state.initial != '') {
      let days = parseInt(state.interval);
      if (!isNaN(days)) {
        let date = new Date(Date.parse(state.initial));
        if (!isNaN(date.getTime())) {
          props.onCreate({
            name: state.name,
            data: {
              days: days,
              initial: date,
            },
            color: state.color,
            type: 'interval',
          });
        }
      }
      return;
    }

    if (state.note && state.description != '') {
      props.onCreate({
        name: state.name,
        data: state.description,
        type: 'note',
        color: state.color,
      });
    }
  };

  useEffect(() => {
    const now = format(Date.now());

    if (!props.editing.status) {
      setState({
        standard: true,
        sequence: false,
        note: false,
        name: 'Unnamed',
        description: 'No description.',
        time: now,
        interval: '7',
        initial: now,
        color: '#d1d1d1',
      });
    } else {
      let object = {};

      if (props.editing.item.index < 0) {
        object = {
          ...state,
          name: props.editing.category.data.title,
          color: props.editing.category.data.color || '#d1d1d1',
        };
      } else {
        object = {
          standard: props.editing.item.data.type == 'standard',
          sequence: props.editing.item.data.type == 'interval',
          note: props.editing.item.data.type == 'note',
          name: props.editing.item.data.name,
          description:
            props.editing.item.data.type == 'note'
              ? props.editing.item.data.data
              : 'No description.',
          time:
            props.editing.item.data.type == 'standard'
              ? format(props.editing.item.data.data)
              : now,
          interval:
            props.editing.item.data.type == 'interval'
              ? props.editing.item.data.data.days
              : '7',
          initial:
            props.editing.item.data.type == 'interval'
              ? format(props.editing.item.data.data.initial)
              : now,
          color: props.editing.item.data.color || '#d1d1d1',
        };
      }

      setState(object);
    }
  }, [props.id]);

  return (
    <div
      style={{
        width: '512px',
        height: `100vh`,
        display: props.disabled ? 'none' : 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D1D1D1',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: 'max-content',
          height: 'max-content',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: 'max-content',
            marginBottom: '25px',
          }}
        >
          <form
            style={{
              width: 'max-content',
              height: 'max-content',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'left',
              marginRight: '20px',
            }}
            noValidate
            autoComplete="off"
          >
            <TextField
              label="Name"
              name="name"
              value={state.name}
              onChange={handleFieldChange}
              className={classes.textField}
            />
            {state.standard && !props.category && (
              <TextField
                label="Time"
                name="time"
                value={state.time}
                onChange={handleFieldChange}
                className={classes.textField}
              />
            )}
            {state.sequence && (
              <TextField
                label="Sequence Interval"
                name="interval"
                value={state.interval}
                onChange={handleFieldChange}
                className={classes.textField}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">days</InputAdornment>
                  ),
                }}
              />
            )}
            {state.sequence && (
              <TextField
                label="Sequence Initial Date"
                name="initial"
                value={state.initial}
                onChange={handleFieldChange}
                className={classes.textField}
              />
            )}
            {state.note && (
              <TextField
                label="Description"
                name="description"
                value={state.description}
                onChange={handleFieldChange}
                className={classes.textField}
              />
            )}
          </form>
          <FormGroup column>
            {!props.category && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.standard}
                    onChange={handleChange}
                    name="standard"
                    color="primary"
                  />
                }
                label="Standard"
              />
            )}
            {!props.category && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.sequence}
                    onChange={handleChange}
                    name="sequence"
                    color="primary"
                  />
                }
                label="Sequence"
              />
            )}
            {!props.category && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.note}
                    onChange={handleChange}
                    name="note"
                    color="primary"
                  />
                }
                label="Note"
              />
            )}
          </FormGroup>
        </div>
        <CompactPicker
          color={state.color}
          onChangeComplete={handleColorChange}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '230px',
            height: 'max-content',
            marginTop: '25px',
          }}
        >
          <Button
            style={{
              width: '110px',
            }}
            variant="contained"
            color="primary"
            onClick={onSubmit}
          >
            Submit
          </Button>
          <Button
            style={{
              width: '110px',
            }}
            variant="contained"
            color="primary"
            onClick={props.onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CreateMenu;
