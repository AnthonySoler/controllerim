import React, { Component } from 'react';
import './App.css';
import { NotesList } from '../NotesList/NotesList';
import { observer } from 'controllerim';

import { AppController } from './AppController';

export const App = observer(class extends Component {
  componentWillMount() {
    this.controller = new AppController(this);
  }

  render() {
    return (
      <div className="appContainer">
        <h1>This is an example of multiple instacne of the same component (with different themes)</h1>
        <h2 data-hook="counter">Total notes count: {this.controller.getTotalNotesCount()}</h2>
        <label className="userNameInputLabel">Enter Your Name:</label>
        <input
          className="userNameInput"
          value={this.controller.getUserName()}
          onChange={(e) => this.controller.setUserName(e.target.value)} />
        <div className="notesContainer">
          <div className="leftNote">
            <NotesList theme={'theme1'} />
          </div>
          <div>
            <NotesList theme={'theme2'} />
          </div>
        </div>
      </div>
    );
  }
});
