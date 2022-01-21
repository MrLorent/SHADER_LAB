import * as THREE from 'three'
import ace from 'brace';
import 'brace/mode/glsl';
import 'brace/ext/language_tools'
import 'brace/snippets/glsl'
import 'brace/theme/chaos';
import { PerspectiveCamera } from 'three';

// theme terminal : 8/10
// theme twilight : 8/10
// theme clouds_midnight : 6/10

export class CodeEditor {
    #editor;

    constructor(container) {
        this.#editor = ace.edit(container);
        this.#editor.getSession().setMode('ace/mode/glsl');
        this.#editor.getSession().setUseWrapMode(true);
        this.#editor.setTheme('ace/theme/chaos');

        this.#editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true,

            maxLines: Infinity,

            // Aesthetic
            fontSize: "1em",
            tabSize: 4,
            showPrintMargin: false
        });
        this.#editor.$blockScrolling = 'Infinity';
        this.#editor.clearSelection();
        this.#editor.resize();
    }

    get_value() {
        return this.#editor.getValue();
    }

    set_value(text)
    {
        this.#editor.setValue(text);
        this.#editor.clearSelection();
    }

    resize()
    {
        this.#editor.resize();
    }

    compile_inputed_uniforms(shader_text, shader, numero_preset){
        let input_details;
        let new_text = "";
        const line = shader_text.split("\n");
        line.forEach(element => {
            let word=element.split(" ");
            if(word[0] == "///"){
                switch(word[1])
                {
                    case "color_picker":
                        word[2] == "scene" ?
                            element = element.replace(element, "uniform  vec3 "+word[3]+"[N_MATERIALS];")
                            :
                            element = element.replace(element, "uniform  vec3 "+word[3]+";");

                        input_details = {
                            "target": word[2],
                            "type": "color_picker",
                            "label": word[4],
                            "name": word[3],
                            "value": "#000000"
                        };
                        break;
                    case "checkbox":
                        element = element.replace(element, "uniform  float "+word[3]+";");
                        input_details = {
                            "target": word[2],
                            "type": "checkbox",
                            "label": word[4],
                            "name": word[3],
                            "checked": 1
                        };
                        break;
                    case "slider":
                        word[2] == "scene" ?
                            element = element.replace(element, "uniform  float "+word[3]+"[N_MATERIALS];")
                            :
                            element = element.replace(element, "uniform  float "+word[3]+";");
                        input_details = {
                            "target": word[2],
                            "type": "slider",
                            "label": word[4],
                            "name": word[3],
                            "min": word[5],
                            "max": word[6],
                            "step": word[7]
                        };
                        break;
                    default:
                        console.log("Error: unknom input type.")
                        break;
                }
                

                shader.add_input(input_details);
            }
            else if (element.includes('creation_scene')){
                element='#include <creation_scene_'+numero_preset+'>'
            }
            new_text += element + "\n";
        });

        /* substr just remove the last enter */
        return new_text.substr(0,new_text.length-1);
    }

    check_shader_compilitation(scene, shader_text,preset){
        let message_to_display = "";
        let context = scene.context;
        let creation = "creation_scene_"+preset;

        let fs  =    THREE.ShaderChunk['test_compile'] +
                     THREE.ShaderChunk['uniforms_and_defines'] +
                     THREE.ShaderChunk['creation_object'] +
                     THREE.ShaderChunk[creation] +
                     THREE.ShaderChunk['RayMarch'] +
                     THREE.ShaderChunk['get_normal'] +
                     THREE.ShaderChunk['rand'] +
                     shader_text +
                     THREE.ShaderChunk['main'];

        let status, log, shader, lines, error, details, i, line, message, true_error=true, warning = false;
        try{
            shader = context.createShader(context.FRAGMENT_SHADER);
            context.shaderSource(shader, fs)
            context.compileShader(shader)
            status = context.getShaderParameter(shader, context.COMPILE_STATUS)
        }
        catch(error1){
            e=error1;
            message_to_display = "error : "+e.getMessage
            return {status:"failed", message: message_to_display};
        }
        if (status === true){
            message_to_display = "shader loaded successfully"
            return {status:"success", message: message_to_display};
        }
        else{
            log = context.getShaderInfoLog(shader)
            console.log(log)
            context.deleteShader(shader);
            lines = log.split('\n');
            for(let j =0, len = lines.length; j <len; j++){
                i = lines[j]
                if(i.includes('ERROR') || i.includes('WARNING')){
                    true_error=false
                    if(!i.includes('invalid directive name')){
                        if (i.includes('WARNING')) warning=true;
                        error = i
                        break;
                    }
                }
            }
            if(!error){
                if(true_error){
                    message_to_display = 'unable to parse error...';
                    return {status:"failed", message: message_to_display};
                }else{
                    message_to_display = "shader loaded successfully";
                    return {status:"success", message: message_to_display};
                }
                
            }
            else
            {
                details = error.split(':')
                if(details.length < 4){
                    message_to_display = error
                    return {status:"failed", message: message_to_display};
                }
                line = details[2];
                message = details.splice(3).join(':')
                message_to_display = "Line : "+parseInt(line-118)+" : "+message
                
                if (warning) message_to_display = "(WARNING) "+message_to_display
                return {status:"failed", message: message_to_display};
            }
        }
    }
}