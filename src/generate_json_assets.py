import os
import json

def generate_assets_json(base_path):
    # Dictionnaire pour stocker les chemins d'images
    assets_structure = {
        "heads": [],
        "hats": [],
        "bodies": [],
        "backs": []
    }

    # Parcours des dossiers et fichiers
    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith(('.png', '.jpg', '.jpeg')):  # Filtre pour les images
                relative_path = os.path.relpath(os.path.join(root, file), base_path)

                if relative_path.startswith("assets/avatars/heads"):
                    assets_structure["heads"].append(relative_path)
                elif relative_path.startswith("assets/avatars/hats"):
                    assets_structure["hats"].append(relative_path)
                elif relative_path.startswith("assets/avatars/bodies"):
                    assets_structure["bodies"].append(relative_path)
                elif relative_path.startswith("assets/avatars/backs"):
                    assets_structure["backs"].append(relative_path)

    # Écriture dans un fichier JSON
    output_path = os.path.join(base_path, "assets_structure.json")
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(assets_structure, json_file, indent=4, ensure_ascii=False)

    print(f"Fichier JSON généré : {output_path}")

if __name__ == "__main__":
    # Chemin de la racine du projet (ajustez si nécessaire)
    project_root = os.path.abspath(".")
    generate_assets_json(project_root)
