import { TextInputData, TextInputObj } from "./SceneData";
import TextInput from "./text-input";
import { ZContainer } from "./ZContainer";

export class ZTextInput extends ZContainer {
    private textInput: TextInput;
    private props: TextInputObj;

    /**
     * Constructs a `ZTextInput` container from scene-editor data.
     */
    constructor(data: TextInputData) {
        super();
        this.props = data.props;

        this.textInput = new TextInput(this.props);

        for (let prop in this.props.input) {
            let v = this.props.input[prop as keyof typeof this.props.input];
            if (v !== undefined) {
                // CSS color properties expect a string; numeric values (hex integers) must be converted.
                if (prop === 'color' && typeof v === 'number') {
                    v = '#' + v.toString(16).padStart(6, '0') as any;
                }
                this.textInput.setInputStyle(prop, v as string);
            }
        }

        this.textInput.updateBox(this.props.box.default, 'DEFAULT');
        this.textInput.updateBox(this.props.box.focused, 'FOCUSED');
        this.textInput.updateBox(this.props.box.disabled, 'DISABLED');

        this.addChild(this.textInput);
    }
}
