import TextInput from "./text-input";
import { ZContainer } from "./ZContainer";
export class ZTextInput extends ZContainer {
    textInput;
    props;
    /**
     * Constructs a `ZTextInput` container from scene-editor data.
     */
    constructor(data) {
        super();
        this.props = data.props;
        this.textInput = new TextInput(this.props);
        for (let prop in this.props.input) {
            let v = this.props.input[prop];
            if (v !== undefined) {
                // CSS color properties expect a string; numeric values (hex integers) must be converted.
                if (prop === 'color' && typeof v === 'number') {
                    v = '#' + v.toString(16).padStart(6, '0');
                }
                this.textInput.setInputStyle(prop, v);
            }
        }
        this.textInput.updateBox(this.props.box.default, 'DEFAULT');
        this.textInput.updateBox(this.props.box.focused, 'FOCUSED');
        this.textInput.updateBox(this.props.box.disabled, 'DISABLED');
        this.addChild(this.textInput);
    }
}
//# sourceMappingURL=ZTextInput.js.map