export class CodeReader
{
    constructor(){

    }

    analyzeText(shader_text, shader){
        let new_text = "";
        const line = shader_text.split("\n");
        line.forEach(element => {
            let word=element.split(" ");
            if(word[0] == "///"){
                // /// uRoughness Roughness 0 1 0.1
                element=element.replace(element, "uniform  float "+word[1]+"[N_MATERIALS];");
                word.splice(0,1);
                word.pop();
                shader.add_personal_input(JSON.parse(JSON.stringify(word)));
            }
            new_text += element + "\n";
        });
        
        return new_text;
    }
}