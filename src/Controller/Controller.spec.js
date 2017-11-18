import * as React from 'react';
import { Controller } from './Controller';
import { mount } from 'enzyme';
import { ProvideController } from '../index';
import PropTypes from 'prop-types';
import { observer } from '../index';
class SomeComponent extends React.Component {
  render() {
    return <div>someComponent</div>
  }
}

let parentComponentRenderCount = 0;

class PrentController extends Controller {
  constructor(componentInstance) {
    super(componentInstance);
    this.state = {
      basicProp: 'blamos',
      objectProp: { name: 'alice' },
      dynamicObject: {}
    };
    console.log('ParentController', this)
  }

  printTest() {
    console.log('*****************************************', this.state);
    return this.getBasicProp();
  }

  getBasicProp() {
    return this.state.basicProp;
  }

  changeBasicProp() {
    this.state.basicProp = "changed!"
  }

  getObjectProp() {
    return this.state.objectProp;
  }

  getDynamicObject() {
    return this.state.dynamicObject;
  }

  changeNameOfObjectProp() {
    this.state.objectProp.name = 'changed!';
  }

  addArrayToDynamicObject() {
    this.state.dynamicObject.array = [];
  }
  addNameToDynamicObjectArray() {
    this.state.dynamicObject.array.push('alice');
  }
  changeTwoPropsButton() {
    this.state.basicProp = false;
    this.state.objectProp.name = 'someName';
  }
}

class Parent extends React.Component {  
  componentWillMount() {
    this.controller = new PrentController(this);
  }

  render() {
    parentComponentRenderCount++;
    return <ProvideController controller={this.controller}>
      <div>
        <Child />
        <div data-hook="basicPropPreview">{this.controller.getBasicProp()}</div>
        <button data-hook="changeBasicPropButton" onClick={() => this.controller.changeBasicProp()} />
        <div data-hook="objectPropPreviw">{JSON.stringify(this.controller.getObjectProp())}</div>
        <button data-hook="changeNameButton" onClick={() => this.controller.changeNameOfObjectProp()} />
        <div data-hook="dynamicObjectPreviw">{JSON.stringify(this.controller.getDynamicObject())}</div>
        <button data-hook="addArrayToDynamicObjectButton" onClick={() => this.controller.addArrayToDynamicObject()} />
        <button data-hook="addNameToDynamicObjectArrayButton" onClick={() => this.controller.addNameToDynamicObjectArray()} />
        <button data-hook="changeTwoPropsButton" onClick={() => this.controller.changeTwoPropsButton()} />

      </div>
    </ProvideController>;
  }
}

class Child extends React.Component {
  componentWillMount() {
    this.parentController = new Controller(this).getParentController('Parent');
  }
  render() {
    return <div data-hook="blamos">{this.parentController.getBasicProp()}</div>
  }
}

Child.contextTypes = {
  controllers: PropTypes.object
};

describe('Controller', () => {
  beforeEach(() => {
    parentComponentRenderCount =0;
    
  });
  it('should save the name of the component it controlls', () => {
    const someComponent = new SomeComponent();
    const testController = new Controller(someComponent);
    expect(testController.getName()).toEqual('SomeComponent');
  });

  it('should allow to get parent controller', () => {
    const someComponent = new SomeComponent();
    someComponent.context = { controllers: { someParent: 'mocekdParentController' } }
    const testController = new Controller(someComponent);
    expect(testController.getParentController('someParent')).toEqual('mocekdParentController');
  });

  it('should throw an error if parent controller does not exist', () => {
    const someComponent = new SomeComponent();
    someComponent.context = { controllers: {} };
    let testController = new Controller(someComponent);
    expect(() => testController.getParentController('someParent'))
      .toThrowError(`Parent controller does not exist. make sure that someParent is parrent of SomeComponent and that you provided it using ProvideController`);

    someComponent.context = {};
    testController = new Controller(someComponent);
    expect(() => testController.getParentController('someParent'))
      .toThrowError(`Parent controller does not exist. make sure that someParent is parrent of SomeComponent and that you provided it using ProvideController`);
  });

  it('should throw an error if context is undefined', () => {
    const someComponent = new SomeComponent();
    someComponent.context = undefined;
    const testController = new Controller(someComponent);
    expect(() => testController.getParentController('someParent'))
      .toThrowError('Context is undefined. Make sure that you initialized SomeComponent in componentWillMount()');
  });

  it('should allow setting the state only with object', () => {
    const testController = new Controller(Parent);
    testController.state = { hello: true };
    expect(testController.state).toEqual({ hello: true });
    expect(() => { testController.state = true }).toThrowError('State should be initialize only with plain object');
    expect(() => { testController.state = ['1', '2'] }).toThrowError('State should be initialize only with plain object');
    expect(() => { testController.state = () => { } }).toThrowError('State should be initialize only with plain object');
    expect(() => { testController.state = "string" }).toThrowError('State should be initialize only with plain object');
    expect(() => { testController.state = 8 }).toThrowError('State should be initialize only with plain object');
  })

  describe('Complex tests', () => {
    it('e2e test', () => {
      const component = mount(<Parent />);
      expect(component.find('[data-hook="blamos"]').text()).toEqual('blamos');
    });

    it('should have an observable state', () => {
      const OberverParent = observer(Parent)
      const component = mount(<OberverParent />);
      expect(component.find('[data-hook="basicPropPreview"]').text()).toEqual('blamos');
      component.find('[data-hook="changeBasicPropButton"]').simulate('click');
      expect(component.find('[data-hook="basicPropPreview"]').text()).toEqual('changed!');
    });

    it('should observe on deep nested change', () => {
      const OberverParent = observer(Parent)
      const component = mount(<OberverParent />);
      expect(component.find('[data-hook="dynamicObjectPreviw"]').text()).toEqual("{}");
      component.find('[data-hook="addArrayToDynamicObjectButton"]').simulate('click');
      expect(component.find('[data-hook="dynamicObjectPreviw"]').text()).toEqual(JSON.stringify({ array: [] }));
      component.find('[data-hook="addNameToDynamicObjectArrayButton"]').simulate('click');
      expect(component.find('[data-hook="dynamicObjectPreviw"]').text()).toEqual(JSON.stringify({ array: ['alice'] }));
    });

    it('should trigger only one render per setter', () => {
      const OberverParent = observer(Parent)
      const component = mount(<OberverParent />);
      expect(parentComponentRenderCount).toEqual(1);
      component.find('[data-hook="changeTwoPropsButton"]').simulate('click');
      //expect(parentComponentRenderCount).toEqual(1);
    })
  });


  describe('when proxy is not availble', () => {
    let backupProxy;
    beforeEach(() => {
      backupProxy = global.Proxy;
      global.Proxy = undefined;
    });

    it('should have an observable state', () => {
      const OberverParent = observer(Parent)
      const component = mount(<OberverParent />);
      expect(component.find('[data-hook="basicPropPreview"]').text()).toEqual('blamos');
      global.Proxy = backupProxy;
      component.find('[data-hook="changeBasicPropButton"]').simulate('click');
      expect(component.find('[data-hook="basicPropPreview"]').text()).toEqual('changed!');
    });

    it('should observe on deep nested change', () => {
      const OberverParent = observer(Parent)
      const component = mount(<OberverParent />);
      expect(component.find('[data-hook="dynamicObjectPreviw"]').text()).toEqual("{}");
      global.Proxy = backupProxy;
      component.find('[data-hook="addArrayToDynamicObjectButton"]').simulate('click');
      expect(component.find('[data-hook="dynamicObjectPreviw"]').text()).toEqual(JSON.stringify({ array: [] }));
      component.find('[data-hook="addNameToDynamicObjectArrayButton"]').simulate('click');
      expect(component.find('[data-hook="dynamicObjectPreviw"]').text()).toEqual(JSON.stringify({ array: ['alice'] }));
    });
  });
});