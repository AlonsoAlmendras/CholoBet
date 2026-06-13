// ============================================================
//  CholoBet API  ·  Cloudflare Worker + KV
//  - Login por usuario (clave por defecto: 123)
//  - Cada uno edita SOLO sus pronosticos
//  - Bloqueo automatico al empezar el partido (por hora de inicio)
//  - Pronosticos ajenos ocultos hasta el inicio (solo indicador "ya puso")
//  - Cambiar clave de cualquiera + registro publico de cambios
//  Binding requerido:  KV  (un KV namespace)
// ============================================================

const SEED = {"fixtures": {"roster": ["Cholo", "Bull", "Cebolla", "Albani", "Simon", "Pablo Benario", "Agu Leon", "Juan", "Tomy", "Emiliano", "Gabo", "Seba Brzo", "Seba Rorsis", "Diego"], "pretorneo": {"Juan": {"fifa": {"bota": "Harry Kane", "mvp": "Kylian Mbappé", "arquero": "David Raya", "joven": "Lamine Yamal", "gol": "Lamine Yamal"}, "podio": ["España", "Francia", "Inglaterra"], "clasificados": ["A · México", "A · Corea del Sur", "B · Canadá", "B · Suiza", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Arabia Saudita", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Simon": {"fifa": {"bota": "Mbappe", "mvp": "Mbappe", "arquero": "Unai Simón", "joven": "Lamine yamal", "gol": "Lamine yamal"}, "podio": ["España", "Francia", "Argentina"], "clasificados": ["A · México", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "K · Uzbekistán", "L · Inglaterra", "L · Croacia"]}, "Cebolla": {"fifa": {"bota": "Mbappe", "mvp": "Lamine Yamal", "arquero": "David Raya", "joven": "Lamine Yamal", "gol": "Lamie Yamal"}, "podio": ["España", "Inglaterra", "Alemania"], "clasificados": ["A · México", "A · Sudáfrica", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "G · Irán", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "K · Portugal", "K · Colombia", "K · RD Congo", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Emiliano": {"fifa": {"bota": "Lamine yamal", "mvp": "Messi", "arquero": "Mike maignan", "joven": "Lamine yamal", "gol": "Mbappe"}, "podio": ["Francia", "España", "Brasil"], "clasificados": ["A · México", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Seba Brzo": {"fifa": {"bota": "Mbappe", "mvp": "Luis diaz", "arquero": "Yassine Bounou", "joven": "Yamal", "gol": "Valverde"}, "podio": ["España", "Francia", "Brasil"], "clasificados": ["A · México", "A · Corea del Sur", "B · Canadá", "B · Suiza", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "G · Irán", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Gabo": {"fifa": {"bota": "Mbappe", "mvp": "Mbappe", "arquero": "Dibu Martinez", "joven": "Doué", "gol": "Cristiano Ronaldo"}, "podio": ["España", "Francia", "Argentina"], "clasificados": ["A · México", "A · Corea del Sur", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Diego": {"fifa": {"bota": "Mbappe", "mvp": "Yamal", "arquero": "David Raya", "joven": "Yamal", "gol": "Julian alvarez"}, "podio": ["España", "Inglaterra", "Francia"], "clasificados": ["A · México", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Bull": {"fifa": {"bota": "Kylian Mbappé", "mvp": "Kylian Mbappé", "arquero": "Mike Maignan", "joven": "Lamine Yamal", "gol": "Michael Olise"}, "podio": ["Francia", "Inglaterra", "España"], "clasificados": ["A · México", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Australia", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Irán", "G · Nueva Zelanda", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Seba Rorsis": {"fifa": {"bota": "Mbappe", "mvp": "Lamine yamal", "arquero": "Unai Simón", "joven": "Lamine Yamal", "gol": "Harry Kane"}, "podio": ["España", "Francia", "Portugal"], "clasificados": ["A · México", "A · Sudáfrica", "A · Corea del Sur", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Haití", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Ecuador", "F · Países Bajos", "F · Japón", "G · Bélgica", "G · Egipto", "G · Nueva Zelanda", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Pablo Benario": {"fifa": {"bota": "kylian mbappe", "mvp": "raphiña", "arquero": "diogo costa", "joven": "Endrick (brasil)", "gol": "desire doue"}, "podio": ["Portugal", "Francia", "Brasil"], "clasificados": ["A · México", "A · Sudáfrica", "A · Corea del Sur", "A · Chequia", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Agu Leon": {"fifa": {"bota": "Michael Olise", "mvp": "Vitinha", "arquero": "Bounou (Marruecos)", "joven": "Lamine Yamal", "gol": "Messi"}, "podio": ["Portugal", "Francia", "España"], "clasificados": ["A · México", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Cholo": {"fifa": {"bota": "Mbappe", "mvp": "Harry Kane", "arquero": "Dibu Martinez", "joven": "Lamine Yamal", "gol": "Michael Olise"}, "podio": ["España", "Francia", "Inglaterra"], "clasificados": ["A · México", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "C · Escocia", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia"]}, "Albani": {"fifa": {"bota": "Kylian Mbappé", "mvp": "Kylian Mbappé", "arquero": "Mike Maignan", "joven": "Lamine Jamal", "gol": "Michael Olise"}, "podio": ["Francia", "España", "Portugal"], "clasificados": ["A · México", "A · Sudáfrica", "A · Corea del Sur", "A · Chequia", "B · Canadá", "B · Suiza", "B · Bosnia y Herzegovina", "C · Brasil", "C · Marruecos", "D · Estados Unidos", "D · Paraguay", "D · Turquía", "E · Alemania", "E · Curazao", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Irán", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Austria", "K · Portugal", "K · Colombia", "L · Inglaterra", "L · Croacia", "L · Ghana"]}, "Tomy": {"fifa": {"bota": "Mbappe", "mvp": "Lamine Yamal", "arquero": "Mike Maignan", "joven": "Arda Guler", "gol": "Neymar Jr"}, "podio": ["Francia", "Argentina", "Brasil"], "clasificados": ["A · México", "A · Sudáfrica", "A · Corea del Sur", "B · Canadá", "B · Suiza", "C · Brasil", "C · Marruecos", "D · Paraguay", "D · Australia", "D · Turquía", "E · Alemania", "E · Costa de Marfil", "E · Ecuador", "F · Países Bajos", "F · Japón", "F · Suecia", "G · Bélgica", "G · Egipto", "G · Irán", "H · España", "H · Uruguay", "I · Francia", "I · Senegal", "I · Noruega", "J · Argentina", "J · Argelia", "K · Portugal", "K · Colombia", "K · RD Congo", "L · Inglaterra", "L · Croacia", "L · Panamá"]}}, "fechas": [{"id": "jue11", "label": "Jueves 11 jun", "fase": "grupos", "partidos": [{"local": "México", "visita": "Sudáfrica", "mult": 1, "kickoff": 1781222400000}, {"local": "Corea del Sur", "visita": "Chequia", "mult": 1, "kickoff": 1781211600000}]}, {"id": "vie12", "label": "Viernes 12 jun", "fase": "grupos", "partidos": [{"local": "Canadá", "visita": "Bosnia y Herzegovina", "mult": 1, "kickoff": 1781283600000}, {"local": "Estados Unidos", "visita": "Paraguay", "mult": 1, "kickoff": 1781316000000}]}, {"id": "sab13", "label": "Sábado 13 jun", "fase": "grupos", "partidos": [{"local": "Catar", "visita": "Suiza", "mult": 1, "kickoff": 1781380800000}, {"local": "Brasil", "visita": "Marruecos", "mult": 1, "kickoff": 1781380800000}, {"local": "Haití", "visita": "Escocia", "mult": 1, "kickoff": 1781391600000}, {"local": "Australia", "visita": "Turquía", "mult": 1, "kickoff": 1781413200000}]}, {"id": "dom14", "label": "Domingo 14 jun", "fase": "grupos", "partidos": [{"local": "Alemania", "visita": "Curazao", "mult": 1, "kickoff": 1781452800000}, {"local": "Países Bajos", "visita": "Japón", "mult": 1, "kickoff": 1781463600000}, {"local": "Costa de Marfil", "visita": "Ecuador", "mult": 1, "kickoff": 1781470800000}, {"local": "Suecia", "visita": "Túnez", "mult": 1, "kickoff": 1781488800000}]}, {"id": "lun15", "label": "Lunes 15 jun", "fase": "grupos", "partidos": [{"local": "España", "visita": "Cabo Verde", "mult": 1, "kickoff": 1781532000000}, {"local": "Bélgica", "visita": "Egipto", "mult": 1, "kickoff": 1781553600000}, {"local": "Arabia Saudita", "visita": "Uruguay", "mult": 1, "kickoff": 1781553600000}, {"local": "Irán", "visita": "Nueva Zelanda", "mult": 1, "kickoff": 1781575200000}]}, {"id": "mar16", "label": "Martes 16 jun", "fase": "grupos", "partidos": [{"local": "Francia", "visita": "Senegal", "mult": 1, "kickoff": 1781629200000}, {"local": "Irak", "visita": "Noruega", "mult": 1, "kickoff": 1781640000000}, {"local": "Argentina", "visita": "Argelia", "mult": 1, "kickoff": 1781654400000}, {"local": "Austria", "visita": "Jordania", "mult": 1, "kickoff": 1781672400000}]}, {"id": "mie17", "label": "Miércoles 17 jun", "fase": "grupos", "partidos": [{"local": "Portugal", "visita": "RD Congo", "mult": 1, "kickoff": 1781712000000}, {"local": "Inglaterra", "visita": "Croacia", "mult": 1, "kickoff": 1781722800000}, {"local": "Ghana", "visita": "Panamá", "mult": 1, "kickoff": 1781730000000}, {"local": "Uzbekistán", "visita": "Colombia", "mult": 1, "kickoff": 1781748000000}]}, {"id": "jue18", "label": "Jueves 18 jun", "fase": "grupos", "partidos": [{"local": "Chequia", "visita": "Sudáfrica", "mult": 1, "kickoff": 1781791200000}, {"local": "Suiza", "visita": "Bosnia y Herzegovina", "mult": 1, "kickoff": 1781812800000}, {"local": "Canadá", "visita": "Catar", "mult": 1, "kickoff": 1781823600000}, {"local": "México", "visita": "Corea del Sur", "mult": 1, "kickoff": 1781830800000}]}, {"id": "vie19", "label": "Viernes 19 jun", "fase": "grupos", "partidos": [{"local": "Estados Unidos", "visita": "Australia", "mult": 1, "kickoff": 1781899200000}, {"local": "Escocia", "visita": "Marruecos", "mult": 1, "kickoff": 1781899200000}, {"local": "Brasil", "visita": "Haití", "mult": 1, "kickoff": 1781908200000}, {"local": "Turquía", "visita": "Paraguay", "mult": 1, "kickoff": 1781928000000}]}, {"id": "sab20", "label": "Sábado 20 jun", "fase": "grupos", "partidos": [{"local": "Países Bajos", "visita": "Suecia", "mult": 1, "kickoff": 1781971200000}, {"local": "Alemania", "visita": "Costa de Marfil", "mult": 1, "kickoff": 1781978400000}, {"local": "Ecuador", "visita": "Curazao", "mult": 1, "kickoff": 1781996400000}, {"local": "Túnez", "visita": "Japón", "mult": 1, "kickoff": 1782014400000}]}, {"id": "dom21", "label": "Domingo 21 jun", "fase": "grupos", "partidos": [{"local": "España", "visita": "Arabia Saudita", "mult": 1, "kickoff": 1782050400000}, {"local": "Bélgica", "visita": "Irán", "mult": 1, "kickoff": 1782072000000}, {"local": "Uruguay", "visita": "Cabo Verde", "mult": 1, "kickoff": 1782072000000}, {"local": "Nueva Zelanda", "visita": "Egipto", "mult": 1, "kickoff": 1782093600000}]}, {"id": "lun22", "label": "Lunes 22 jun", "fase": "grupos", "partidos": [{"local": "Argentina", "visita": "Austria", "mult": 1, "kickoff": 1782144000000}, {"local": "Francia", "visita": "Irak", "mult": 1, "kickoff": 1782154800000}, {"local": "Noruega", "visita": "Senegal", "mult": 1, "kickoff": 1782165600000}, {"local": "Jordania", "visita": "Argelia", "mult": 1, "kickoff": 1782187200000}]}, {"id": "mar23", "label": "Martes 23 jun", "fase": "grupos", "partidos": [{"local": "Portugal", "visita": "Uzbekistán", "mult": 1, "kickoff": 1782230400000}, {"local": "Inglaterra", "visita": "Ghana", "mult": 1, "kickoff": 1782237600000}, {"local": "Panamá", "visita": "Croacia", "mult": 1, "kickoff": 1782248400000}, {"local": "Colombia", "visita": "RD Congo", "mult": 1, "kickoff": 1782266400000}]}, {"id": "mie24", "label": "Miércoles 24 jun", "fase": "grupos", "partidos": [{"local": "Suiza", "visita": "Canadá", "mult": 1, "kickoff": 1782331200000}, {"local": "Bosnia y Herzegovina", "visita": "Catar", "mult": 1, "kickoff": 1782331200000}, {"local": "Escocia", "visita": "Brasil", "mult": 1, "kickoff": 1782331200000}, {"local": "Marruecos", "visita": "Haití", "mult": 1, "kickoff": 1782331200000}, {"local": "Chequia", "visita": "México", "mult": 1, "kickoff": 1782349200000}, {"local": "Sudáfrica", "visita": "Corea del Sur", "mult": 1, "kickoff": 1782349200000}]}, {"id": "jue25", "label": "Jueves 25 jun", "fase": "grupos", "partidos": [{"local": "Curazao", "visita": "Costa de Marfil", "mult": 1, "kickoff": 1782410400000}, {"local": "Ecuador", "visita": "Alemania", "mult": 1, "kickoff": 1782410400000}, {"local": "Japón", "visita": "Suecia", "mult": 1, "kickoff": 1782424800000}, {"local": "Túnez", "visita": "Países Bajos", "mult": 1, "kickoff": 1782424800000}, {"local": "Turquía", "visita": "Estados Unidos", "mult": 1, "kickoff": 1782442800000}, {"local": "Paraguay", "visita": "Australia", "mult": 1, "kickoff": 1782442800000}]}, {"id": "vie26", "label": "Viernes 26 jun", "fase": "grupos", "partidos": [{"local": "Noruega", "visita": "Francia", "mult": 1, "kickoff": 1782493200000}, {"local": "Senegal", "visita": "Irak", "mult": 1, "kickoff": 1782493200000}, {"local": "Cabo Verde", "visita": "Arabia Saudita", "mult": 1, "kickoff": 1782514800000}, {"local": "Uruguay", "visita": "España", "mult": 1, "kickoff": 1782518400000}, {"local": "Egipto", "visita": "Irán", "mult": 1, "kickoff": 1782532800000}, {"local": "Nueva Zelanda", "visita": "Bélgica", "mult": 1, "kickoff": 1782532800000}]}, {"id": "sab27", "label": "Sábado 27 jun", "fase": "grupos", "partidos": [{"local": "Panamá", "visita": "Inglaterra", "mult": 1, "kickoff": 1782586800000}, {"local": "Croacia", "visita": "Ghana", "mult": 1, "kickoff": 1782586800000}, {"local": "Colombia", "visita": "Portugal", "mult": 1, "kickoff": 1782595800000}, {"local": "RD Congo", "visita": "Uzbekistán", "mult": 1, "kickoff": 1782595800000}, {"local": "Argelia", "visita": "Austria", "mult": 1, "kickoff": 1782608400000}, {"local": "Jordania", "visita": "Argentina", "mult": 1, "kickoff": 1782608400000}]}]}, "results": {"jue11": [{"rl": 2, "rv": 0}, {"rl": 2, "rv": 1}], "vie12": [{"rl": 1, "rv": 1}, {"rl": 4, "rv": 1}]}, "predictions": {"Juan": {"jue11": [{"gl": 2, "gv": 1}, {"gl": 2, "gv": 1}], "vie12": [{"gl": 1, "gv": 0}, {"gl": 0, "gv": 1}]}, "Simon": {"jue11": [{"gl": 2, "gv": 0}, {"gl": 1, "gv": 1}], "vie12": [{"gl": 2, "gv": 1}, {"gl": 2, "gv": 1}]}, "Gabo": {"jue11": [{"gl": 3, "gv": 1}, {"gl": 1, "gv": 0}], "vie12": [{"gl": 1, "gv": 1}, {"gl": 0, "gv": 1}]}, "Emiliano": {"jue11": [{"gl": 2, "gv": 0}, {"gl": 0, "gv": 1}], "vie12": [{"gl": 2, "gv": 0}, {"gl": 1, "gv": 2}]}, "Diego": {"jue11": [{"gl": 2, "gv": 0}, {"gl": 1, "gv": 1}], "vie12": [{"gl": 2, "gv": 1}, {"gl": 1, "gv": 0}]}, "Albani": {"jue11": [{"gl": 3, "gv": 1}, {"gl": 1, "gv": 1}], "vie12": [{"gl": 1, "gv": 0}, {"gl": 2, "gv": 1}]}, "Bull": {"jue11": [{"gl": 2, "gv": 0}, {"gl": 1, "gv": 1}], "vie12": [{"gl": "", "gv": ""}, {"gl": 1, "gv": 1}]}, "Cebolla": {"jue11": [{"gl": 2, "gv": 1}, {"gl": 2, "gv": 1}], "vie12": [{"gl": 1, "gv": 0}, {"gl": 2, "gv": 1}]}, "Seba Rorsis": {"jue11": [{"gl": 1, "gv": 0}, {"gl": 2, "gv": 0}], "vie12": [{"gl": "", "gv": ""}, {"gl": 1, "gv": 1}]}, "Seba Brzo": {"jue11": [{"gl": 2, "gv": 1}, {"gl": 1, "gv": 0}], "vie12": [{"gl": 1, "gv": 0}, {"gl": 1, "gv": 0}]}, "Agu Leon": {"jue11": [{"gl": 2, "gv": 1}, {"gl": 1, "gv": 1}], "vie12": [{"gl": 0, "gv": 1}, {"gl": 0, "gv": 2}]}, "Cholo": {"jue11": [{"gl": 1, "gv": 0}, {"gl": 1, "gv": 1}], "vie12": [{"gl": 1, "gv": 0}, {"gl": 1, "gv": 0}]}, "Pablo Benario": {"jue11": [{"gl": 1, "gv": 0}, {"gl": 1, "gv": 1}], "vie12": [{"gl": 0, "gv": 2}, {"gl": 0, "gv": 2}]}, "Tomy": {"jue11": [{"gl": 2, "gv": 0}, {"gl": 3, "gv": 1}], "vie12": [{"gl": 1, "gv": 0}, {"gl": 0, "gv": 2}]}}, "actuals": {"clasificados": [], "fifa": {}, "podio": ["", "", ""]}};
const ADMIN_PASS = 'cholobet2026';        // <<< CAMBIA tu clave de admin
const TOKEN_TTL = 60 * 60 * 24 * 45;      // sesiones ~45 dias

/* ---------- utilidades ---------- */
function cors(resp){
  resp.headers.set('Access-Control-Allow-Origin', '*');
  resp.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  resp.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return resp;
}
function json(obj, status){
  return cors(new Response(JSON.stringify(obj), {status: status || 200, headers: {'Content-Type': 'application/json'}}));
}
async function sha(s){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function num(v){
  if(v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  if(!isFinite(n)) return '';
  return Math.max(0, Math.floor(n));
}
async function readJSON(req){ try{ return await req.json(); }catch(e){ return {}; } }
function answered(p){ return !!(p && p.gl !== '' && p.gl != null && p.gv !== '' && p.gv != null); }

/* ---------- semilla en KV (una sola vez) ---------- */
async function ensureSeed(env){
  if(await env.KV.get('seeded')) return;
  await env.KV.put('fixtures', JSON.stringify(SEED.fixtures));
  await env.KV.put('results', JSON.stringify(SEED.results || {}));
  await env.KV.put('actuals', JSON.stringify(SEED.actuals || {clasificados: [], fifa: {}, podio: ['', '', '']}));
  await env.KV.put('pwlog', JSON.stringify([]));
  const preds = SEED.predictions || {};
  for(const user of Object.keys(preds)) await env.KV.put('pred:' + user, JSON.stringify(preds[user]));
  await env.KV.put('seeded', '1');
}
async function getFixtures(env){ return JSON.parse(await env.KV.get('fixtures') || JSON.stringify(SEED.fixtures)); }
async function getResults(env){ return JSON.parse(await env.KV.get('results') || '{}'); }
async function getActuals(env){ return JSON.parse(await env.KV.get('actuals') || '{"clasificados":[],"fifa":{},"podio":["","",""]}'); }
async function getPwlog(env){ return JSON.parse(await env.KV.get('pwlog') || '[]'); }
async function getPred(env, user){ return JSON.parse(await env.KV.get('pred:' + user) || '{}'); }
async function userFromToken(env, token){ return token ? await env.KV.get('tok:' + token) : null; }

/* ---------- router ---------- */
export default {
  async fetch(request, env){
    if(request.method === 'OPTIONS') return cors(new Response(null, {status: 204}));
    if(!env.KV) return json({error: 'Falta el binding KV: en el Worker ve a Settings -> Bindings y agrega un KV namespace con nombre KV.'}, 500);
    await ensureSeed(env);
    const url = new URL(request.url);
    const seg = (url.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
    try{
      if(seg === 'state')    return await handleState(env);
      if(seg === 'login')    return await handleLogin(env, request);
      if(seg === 'mine')     return await handleMine(env, url);
      if(seg === 'save')     return await handleSave(env, request);
      if(seg === 'chpass')   return await handleChpass(env, request);
      if(seg === 'results')  return await handleResults(env, request);
      if(seg === 'actuals')  return await handleActuals(env, request);
      if(seg === 'kickoff')  return await handleKickoff(env, request);
      if(seg === 'addmatch') return await handleAddMatch(env, request);
      return json({ok: true, msg: 'CholoBet API viva'});
    }catch(e){
      return json({error: String((e && e.message) || e)}, 500);
    }
  }
};

/* ---------- estado publico (con filtro por hora) ---------- */
async function handleState(env){
  const fx = await getFixtures(env);
  const results = await getResults(env);
  const actuals = await getActuals(env);
  const pwlog = await getPwlog(env);
  const now = Date.now();
  const allPred = {};
  for(const user of fx.roster) allPred[user] = await getPred(env, user);
  const fechas = fx.fechas.map(f => {
    const res = results[f.id] || [];
    const partidos = f.partidos.map((p, i) => ({
      local: p.local, visita: p.visita, mult: p.mult, kickoff: p.kickoff,
      rl: res[i] ? res[i].rl : '', rv: res[i] ? res[i].rv : ''
    }));
    const preds = {};
    for(const user of fx.roster){
      const arr = (allPred[user] || {})[f.id];
      if(!arr) continue;
      const cells = partidos.map((p, i) => {
        const pr = arr[i];
        if(!answered(pr)) return null;
        return (now >= p.kickoff) ? {gl: pr.gl, gv: pr.gv} : {a: 1};
      });
      if(cells.some(c => c)) preds[user] = cells;
    }
    return {id: f.id, label: f.label, fase: f.fase, partidos, preds};
  });
  return json({roster: fx.roster, pretorneo: fx.pretorneo, fechas, actuals, pwlog, serverTime: now});
}

/* ---------- login ---------- */
async function handleLogin(env, request){
  const {user, password} = await readJSON(request);
  const fx = await getFixtures(env);
  if(!fx.roster.includes(user)) return json({ok: false, error: 'Ese usuario no existe'});
  const stored = await env.KV.get('pw:' + user);
  const expected = stored || await sha('123');
  if(await sha(password || '') !== expected) return json({ok: false, error: 'Clave incorrecta'});
  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  await env.KV.put('tok:' + token, user, {expirationTtl: TOKEN_TTL});
  return json({ok: true, token, user});
}

/* ---------- mis pronosticos (privado) ---------- */
async function handleMine(env, url){
  const user = await userFromToken(env, url.searchParams.get('token'));
  if(!user) return json({ok: false, error: 'Sesion invalida'}, 401);
  return json({ok: true, user, fechas: await getPred(env, user)});
}

/* ---------- guardar pronosticos (bloquea los ya empezados) ---------- */
async function handleSave(env, request){
  const {token, fechaId, preds} = await readJSON(request);
  const user = await userFromToken(env, token);
  if(!user) return json({ok: false, error: 'Sesion invalida'}, 401);
  const fx = await getFixtures(env);
  const f = fx.fechas.find(x => x.id === fechaId);
  if(!f) return json({ok: false, error: 'Fecha no existe'});
  const now = Date.now();
  const cur = await getPred(env, user);
  const existing = cur[fechaId] || [];
  const out = f.partidos.map((p, i) => {
    if(now >= p.kickoff){ const e = existing[i] || {gl: '', gv: ''}; return {gl: num(e.gl), gv: num(e.gv)}; }
    const inc = (preds && preds[i]) || {gl: '', gv: ''};
    return {gl: num(inc.gl), gv: num(inc.gv)};
  });
  cur[fechaId] = out;
  await env.KV.put('pred:' + user, JSON.stringify(cur));
  const locked = f.partidos.map((p, i) => now >= p.kickoff ? i : -1).filter(i => i >= 0);
  return json({ok: true, saved: out, locked});
}

/* ---------- cambiar clave de cualquiera + log publico ---------- */
async function handleChpass(env, request){
  const {target, newPassword} = await readJSON(request);
  const fx = await getFixtures(env);
  if(!fx.roster.includes(target)) return json({ok: false, error: 'Ese usuario no existe'});
  if(!newPassword || String(newPassword).length < 1) return json({ok: false, error: 'La clave no puede ir vacia'});
  await env.KV.put('pw:' + target, await sha(newPassword));
  const log = await getPwlog(env);
  log.unshift({user: target, ts: Date.now()});
  if(log.length > 300) log.length = 300;
  await env.KV.put('pwlog', JSON.stringify(log));
  return json({ok: true, pwlog: log});
}

/* ---------- admin: resultados ---------- */
async function handleResults(env, request){
  const {adminPass, fechaId, results} = await readJSON(request);
  if(adminPass !== ADMIN_PASS) return json({ok: false, error: 'Clave de admin incorrecta'}, 403);
  const fx = await getFixtures(env);
  const f = fx.fechas.find(x => x.id === fechaId);
  if(!f) return json({ok: false, error: 'Fecha no existe'});
  const all = await getResults(env);
  all[fechaId] = f.partidos.map((p, i) => { const r = (results && results[i]) || {}; return {rl: num(r.rl), rv: num(r.rv)}; });
  await env.KV.put('results', JSON.stringify(all));
  return json({ok: true});
}

/* ---------- admin: pre-torneo ---------- */
async function handleActuals(env, request){
  const {adminPass, actuals} = await readJSON(request);
  if(adminPass !== ADMIN_PASS) return json({ok: false, error: 'Clave de admin incorrecta'}, 403);
  const a = actuals || {};
  await env.KV.put('actuals', JSON.stringify({
    clasificados: Array.isArray(a.clasificados) ? a.clasificados : [],
    fifa: (a.fifa && typeof a.fifa === 'object') ? a.fifa : {},
    podio: Array.isArray(a.podio) ? a.podio.slice(0, 3) : ['', '', '']
  }));
  return json({ok: true});
}

/* ---------- admin: ajustar hora de inicio ---------- */
async function handleKickoff(env, request){
  const {adminPass, fechaId, matchIdx, kickoff} = await readJSON(request);
  if(adminPass !== ADMIN_PASS) return json({ok: false, error: 'Clave de admin incorrecta'}, 403);
  const fx = await getFixtures(env);
  const f = fx.fechas.find(x => x.id === fechaId);
  if(!f || !f.partidos[matchIdx]) return json({ok: false, error: 'Partido no existe'});
  const k = Number(kickoff);
  if(!isFinite(k)) return json({ok: false, error: 'Hora invalida'});
  f.partidos[matchIdx].kickoff = k;
  await env.KV.put('fixtures', JSON.stringify(fx));
  return json({ok: true});
}

/* ---------- admin: agregar partido (eliminatorias) ---------- */
async function handleAddMatch(env, request){
  const {adminPass, fase, label, local, visita, mult, kickoff} = await readJSON(request);
  if(adminPass !== ADMIN_PASS) return json({ok: false, error: 'Clave de admin incorrecta'}, 403);
  if(!label || !local || !visita) return json({ok: false, error: 'Faltan datos'});
  const fx = await getFixtures(env);
  let f = fx.fechas.find(x => x.label === label && (x.fase || 'grupos') === (fase || 'grupos'));
  if(!f){ f = {id: 'x' + Date.now(), label, fase: fase || 'grupos', partidos: []}; fx.fechas.push(f); }
  f.partidos.push({local, visita, mult: Number(mult) || 1, kickoff: Number(kickoff) || Date.now()});
  await env.KV.put('fixtures', JSON.stringify(fx));
  return json({ok: true});
}