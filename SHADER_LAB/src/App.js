import * as THREE from 'three';

import Scene from './Canvas/Scene.js'
import init_shader_chunk from "./Canvas/init_shader_chunk.js";

import nav_bar_as_HTML from './nav_bar.jsx';
import input_fieldset_as_HTML from './input_fieldset.jsx';
import switch_input_panel_button from './switch_input_panel_button.jsx';
import compile_button_as_HTML from './compile_button.jsx'

import { CodeEditor } from './CodeEditor/CodeEditor.js';
import { CodeReader } from './CodeEditor/CodeReader.js';
import { CodeChecker } from './CodeEditor/CodeChecker.js';

export class App
{
    // LIST OF SCENE ELEMENTS
    SCENE = 0
    BOX = 1;
    SPHERE = 2;
    SCENE_ELEMENTS = 2;

    // LIST OF SHADERS
    FLAT_PAINTING = 0;
    LAMBERT = 1;
    PHONG = 2;
    PERSONAL = 3;

    scene;

    codeEditor;
    codeReader;
    codeChecker;

    shader_list;
    current_shader;

    constructor(shader_list){
        // NAVIGATION
        this.insert_switch_input_panel_button_in_HTML();

        // SCENE
        this.scene = new Scene();

        // INIT LIST OF SHADERS
        init_shader_chunk(THREE.ShaderChunk);
        this.shader_list = shader_list;
        this.insert_shader_buttons_in_HTML();


        // CODE_EDITOR
        this.codeEditor = new CodeEditor('code_editor');
        this.codeReader = new CodeReader();
        this.codeChecker = new CodeChecker();
        this.insert_compile_button();

        // INIT CURRENT SHADER
        this.init_shader(this.FLAT_PAINTING);
        this.init_material();
        this.insert_inputs_in_HTML();
        this.on_window_resize(this.scene, this.shader_list[this.current_shader]);
        this.codeEditor.set_value(this.shader_list[this.current_shader].fragment_shader);
        
        // WINDOW MANAGEMENT
        window.addEventListener(
            'resize',
            () => { this.on_window_resize(this.scene, this.shader_list[this.current_shader]); },
            false
        );
    }

    init_shader(new_shader_id)
    {
        this.current_shader = new_shader_id;
        
        this.init_material();
        this.insert_inputs_in_HTML();
        this.on_window_resize(this.scene, this.shader_list[this.current_shader]);
        this.codeEditor.set_value(this.shader_list[new_shader_id].fragment_shader);
    }

    update_shader()
    {
        let user_shader_input = this.codeEditor.get_value();
        user_shader_input = this.codeReader.analyzeText(user_shader_input, this.shader_list[this.current_shader]);

        const compilation_test = this.codeChecker.check_compilation(this.scene, user_shader_input);
        if(compilation_test.compilation_state)
        {
            this.shader_list[this.current_shader].fragment_shader = user_shader_input;
            this.init_shader(this.current_shader);
        }
        else
        {

        }

        document.getElementById('console').innerHTML = compilation_test.message;
    }

    init_material(){
        let material = new THREE.ShaderMaterial({
            uniforms: this.shader_list[this.current_shader].uniforms,
            vertexShader: this.shader_list[this.current_shader].vertex_shader,
            fragmentShader: this.shader_list[this.current_shader].fragment_shader,
            depthTest: false,
            depthWrite: false
        });
    
        this.scene.mesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2,2),
            material
        );
        this.scene.scene.add(this.scene.mesh);
        this.scene.camera.add(this.scene.mesh);

    }

    insert_switch_input_panel_button_in_HTML()
    {
        const navigation_panel = document.getElementById('navigation_panel');
        navigation_panel.append(switch_input_panel_button());
    }

    insert_compile_button()
    {
        const code_editor_buttons = document.getElementById('code_editor_panel');
        code_editor_buttons.append(compile_button_as_HTML(this));
    }

    insert_shader_buttons_in_HTML()
    {
        const header = document.querySelector('header');

        let shaders_name = [];
        let shaders_id = [];

        for(let i in this.shader_list)
        {
            shaders_name.push(this.shader_list[i].get_name());
            shaders_id[this.shader_list[i].get_name()] = i;
        }
        header.append(nav_bar_as_HTML(shaders_name, shaders_id, this));
    }

    insert_inputs_in_HTML()
    {
        const HTML_container = document.getElementById('input_container');
        while(HTML_container.firstElementChild){
            HTML_container.removeChild(HTML_container.firstElementChild);
        }
        HTML_container.innerHTML = ""

        const shader = this.shader_list[this.current_shader];
        const light_inputs = shader.get_light_inputs();

        if(light_inputs.length != 0)
        {
            let light_input_container = input_fieldset_as_HTML(light_inputs, "light parameters :");

            for(let i in light_inputs)
            {
                light_input_container.append(light_inputs[i].get_as_HTML(this.SCENE, shader));
            }
            HTML_container.append(light_input_container);
        }

        const scene_inputs = shader.get_scene_inputs();

        if(scene_inputs.length != 0)
        {
            for(let k=1; k<=this.SCENE_ELEMENTS; k++)
            {
                let legend="";
                k==1 ? legend = "box parameters :" : legend = "sphere parameters";
                let scene_input_container = input_fieldset_as_HTML(scene_inputs, legend)
                for(let i in scene_inputs)
                {
                    scene_input_container.append(scene_inputs[i].get_as_HTML(k, shader));
                }
                HTML_container.append(scene_input_container);
            }
        }

        if(light_inputs.length == 0 && scene_inputs == 0)
        {
            HTML_container.innerHTML = "No input detected for this shader yet.";
        }
    }

    render()
    {
        this.scene.frame_time = this.scene.clock.getDelta();
        this.scene.elapsed_time = this.scene.clock.getElapsedTime() % 1000;
    
        this.shader_list[this.current_shader].uniforms.uTime.value = this.scene.elapsed_time;
        this.scene.camera.updateMatrixWorld(true);
        this.shader_list[this.current_shader].uniforms.uCameraPosition.value.copy(this.scene.camera.position);
    
        this.scene.renderer.setRenderTarget(null);
        this.scene.renderer.render(this.scene.scene, this.scene.camera);
    }

    on_window_resize(scene, current_shader)
    {
        let SCREEN_WIDTH = window.innerWidth * 0.45;
        let SCREEN_HEIGHT = window.innerHeight * 0.9;

        scene.renderer.setPixelRatio(1);
        scene.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        current_shader.uniforms.uResolution.value.x = scene.context.drawingBufferWidth;
        current_shader.uniforms.uResolution.value.y = scene.context.drawingBufferHeight;

        scene.target.setSize(scene.context.drawingBufferWidth, scene.context.drawingBufferHeight);

        scene.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
        scene.camera.updateProjectionMatrix();

        this.codeEditor.resize();
    }
}