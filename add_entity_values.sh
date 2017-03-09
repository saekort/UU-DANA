#!/bin/sh

## Simple convenience shell script to add values for a given and existing token.
## Backend will not add duplicates.

ENTITY=minor
TODAY=`date +'%Y%m%d'`
TOKEN=$1

if [ "x$TOKEN" = x ] ; then
    echo Usage: `basename $0` '<Server Access Token>'
    echo
    exit 1
fi


cat <<EOF |
Biologie
Structuurbiologie
Educatieve minor beta
Geneesmiddelonderzoek
Geschiedenis en Filosofie van de Natuurwetenschappen
Computational Science
Informatica
Informatica voor hbo-studenten
Informatiekunde
Organisatie en informatie voor HBO-studenten
Meteorologie, fysische oceanografie en klimaat
Natuurkunde
Nanomaterials
Wiskunde voor informatici
Wiskunde voor natuurkundigen
Wiskunde voor niet-natuurkundigen
Addiction
Health, Behaviour, and Society
Methods and Statistics in the Social and Behavioural Sciences (methoden en technieken)
Social Neuroscience
Social Policies in Contemporary Europe: New inequalities and risks (SPiCE)
Water, Climate and Ecosystems
Comparative Media Studies
Conflict Studies
Creative Cities
Global Asia
Business Economics
Economics
Entrepreneurship
Atlantic Europe
English Language and Culture
Ethics in Modern Society
Gender Studies
Keltische talen en cultuur
Postcolonial studies
European Governance
Algemene sociale wetenschappen
Arbeids- en Organisatiepsychologie
Arbeid, zorg en participatie
Beleidssociologie
Burgerschap, Identiteit en Mondialisering
Cognitie
Culturele diversiteit
Cultuur, communicatie en mediastudies
Educatieve minor alfa
Educatieve minor gamma
Gehandicaptenzorg en kinderrevalidatie
Jeugd en criminaliteit
Jeugdstudies
Leerproblemen
Maatschappelijke opvoedingsvraagstukken
Multiculturele samenleving
Onderwijskunde
Orthopedagogiek
Persoonlijkheid en relaties
Psychosociale problemen
Research en development
Sociaalwetenschappelijk onderzoek
Sociology and Social Research
Sociology: Contemporary Social Problems
Solidariteit en sociaal kapitaal
Sport, pedagogiek en beleid
Aarde, klimaat en  leven (biogeologie)
Aarde, water en milieu (geochemie)
Geologie van de vaste aarde
Natuurkunde van de vaste aarde (geofysica)
Duurzaam ondernemen en innovatie
Duurzame ontwikkeling
Entrepreneurship in Life Sciences and Health
Global Change
Globalisering en mondiale ongelijkheid
Innovatiewetenschap (Innovation Science)
Milieu-maatschappijwetenschappen
Milieu-natuurwetenschappen
Development Geography
Economische geografie
Nationale Geo-informatie minor
Planologie
Sociale geografie
Stadsgeografie
Sustainable Energy
Antieke cultuur
Arabisch
Archeologie
Beeldcultuur en samenleving
Communicatie- en informatiewetenschappen
De macht en onmacht van de markt
De Middellandse zee: brug en kloof
De sprekende samenleving
Digital Humanities
Duitse taal en cultuur
Esthetica (filosofie van de kunsten)
Franse taal en cultuur
Game Studies
Geschiedenis
Geschiedenis en herinnering in de digitale wereld
Gouden tijden in Vroegmodern Europa: conflict, competitie en creativiteit
Griekse taal & cultuur in de Europese traditie
Grote werken uit de literatuur
Het goede, het ware, het schone
Internationale betrekkingen
Islam
Italiaanse taal en cultuur
Kunst, beleid en maatschappij
Kunstgeschiedenis
Kunstmatige intelligentie
Latijnse taal & cultuur in de Europese traditie
Literature in conflict
Literatuur en levensbeschouwing
Literatuurwetenschap
Logopediewetenschap
Middeleeuwen
Media en cultuur
Muziekwetenschap
Nederlandse cultuur
Nederlandse taal en cultuur
Politiek tussen nationale staat en mondiale samenleving
Religie in het publieke domein
Religiestudies
Spaanse taal en cultuur
Taalontwikkeling
Taalwetenschap
Wat is de mens?
Wetenschapsgeschiedenis
Bestuurs- en Organisatiewetenschap Algemeen
Criminologie voor studenten Rechtsgeleerdheid
Inleiding in het recht
Sociaal Ondernemerschap
Theorie van het recht
EOF
while read line
do
    echo Adding:.$line. "\n"

    echo curl -XPOST "https://api.wit.ai/entities/$ENTITY/values?v=$TODAY" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"value\":\"$line\" }"
done
