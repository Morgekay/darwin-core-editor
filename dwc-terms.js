// Термины Darwin Core (dwc:) с пояснениями на русском.
// Формат строки: термин | группа | пояснение | пример
window.DWC_GROUPS = {
  tax: 'Таксон (что за организм)',
  occ: 'Находка (Occurrence)',
  evt: 'Событие сбора (Event)',
  loc: 'Место (Location)',
  idn: 'Определение (Identification)',
  rec: 'Запись и набор данных (Record-level)'
};

window.DWC_RAW = `
scientificName|tax|Полное научное название организма (по возможности с автором). Главное поле для таксона.|Laboulbenia vulgaris Peyr.
scientificNameAuthorship|tax|Автор и год описания названия, как принято в номенклатуре.|Thaxt., 1900
kingdom|tax|Царство.|Fungi
phylum|tax|Тип (отдел).|Ascomycota
class|tax|Класс.|Laboulbeniomycetes
order|tax|Порядок.|Laboulbeniales
superfamily|tax|Надсемейство.|
family|tax|Семейство.|Laboulbeniaceae
subfamily|tax|Подсемейство.|
tribe|tax|Триба.|
genus|tax|Род (только название рода, одним словом).|Laboulbenia
genericName|tax|Название рода, если scientificName указан не полностью (например, только эпитет).|
subgenus|tax|Подрод.|
infragenericEpithet|tax|Эпитет внутриродовой группы (секции, подрода).|
specificEpithet|tax|Видовой эпитет (вторая часть биномена).|vulgaris
infraspecificEpithet|tax|Внутривидовой эпитет (подвид, вариация).|immaculata
cultivarEpithet|tax|Название культивара (для культурных растений/грибов).|
taxonRank|tax|Ранг таксона, указанного в scientificName.|species
verbatimTaxonRank|tax|Ранг так, как он написан в источнике.|sp. nov.
taxonID|tax|Уникальный идентификатор таксона в вашей базе или внешней (например, GBIF, Index Fungorum).|IF 123456
scientificNameID|tax|Идентификатор названия в номенклатурной базе (LSID, MycoBank, Index Fungorum).|urn:lsid:indexfungorum.org:names:...
acceptedNameUsage|tax|Принятое (валидное) название, если указанное — синоним.|
acceptedNameUsageID|tax|Идентификатор принятого названия.|
parentNameUsage|tax|Название родительского таксона (напр., рода для вида).|
parentNameUsageID|tax|Идентификатор родительского таксона.|
originalNameUsage|tax|Название в исходном первоописании (базионим).|
originalNameUsageID|tax|Идентификатор исходного названия.|
nameAccordingTo|tax|Источник, по которому принята данная трактовка таксона (автор/работа).|Santamaria & Pedersen 2021
nameAccordingToID|tax|Идентификатор этого источника.|
namePublishedIn|tax|Публикация, в которой название впервые опубликовано.|Mem. Am. Acad. Arts Sci. 13: 217
namePublishedInID|tax|Идентификатор публикации с первоописанием.|
namePublishedInYear|tax|Год первоописания.|1908
higherClassification|tax|Полная классификация вышестоящих таксонов в виде списка через « | ».|Fungi | Ascomycota | Laboulbeniomycetes
vernacularName|tax|Народное (обиходное) название.|
nomenclaturalCode|tax|Номенклатурный кодекс.|ICN
taxonomicStatus|tax|Таксономический статус названия.|accepted
nomenclaturalStatus|tax|Номенклатурный статус (nom. nov., nom. illeg. и др.).|
taxonConceptID|tax|Идентификатор таксономической концепции.|
taxonRemarks|tax|Примечания о таксоне.|
occurrenceID|occ|Уникальный идентификатор каждой находки (строки). Не должен повторяться. Обязательное по сути поле.|LABMYC-0001
basisOfRecord|occ|Тип материала, на котором основана запись: гербарный/коллекционный образец, наблюдение, литературная ссылка и т. д.|PreservedSpecimen
catalogNumber|occ|Номер образца в коллекции/гербарии.|KHER L00113
recordNumber|occ|Номер сбора (полевой номер), присвоенный сборщиком.|
recordedBy|occ|Кто собрал/наблюдал (collector). Несколько людей — через « | » или «;».|R. Mishustin
individualCount|occ|Количество особей/экземпляров в находке (число).|3
organismQuantity|occ|Количество организмов в выбранных единицах (число, плотность, покрытие).|
organismQuantityType|occ|Единицы для organismQuantity.|individuals
sex|occ|Пол организма (для хозяина/самого организма).|female
lifeStage|occ|Стадия развития.|adult
reproductiveCondition|occ|Репродуктивное состояние (напр., со зрелыми перитециями).|
behavior|occ|Поведение организма в момент находки.|
establishmentMeans|occ|Как организм попал в место находки: аборигенный, интродуцированный и т. д.|native
degreeOfEstablishment|occ|Степень закрепления вида в регионе (для инвазивных).|
pathway|occ|Путь, которым вид проник в регион.|
occurrenceStatus|occ|Присутствие или отсутствие: present / absent.|present
preparations|occ|Как подготовлен образец (слайд, спирт, сухой гербарий).|slide mount; ethanol 95%
disposition|occ|Состояние образца: в коллекции, утрачен, на обмене.|in collection
otherCatalogNumbers|occ|Другие номера этого же образца (в других коллекциях, номера хозяина).|i00091
associatedMedia|occ|Ссылки на фото/видео/аудио, связанные с находкой.|
associatedReferences|occ|Литература, в которой опубликована или упомянута находка.|Mishustin et al. 2022, Czech Mycol. 74(2)
associatedSequences|occ|Ссылки на генетические последовательности (GenBank).|MH718837
associatedTaxa|occ|Организмы, с которыми связана находка. Для паразитов — вид-хозяин («host of: ...»).|host: Harmonia axyridis
organismID|occ|Идентификатор конкретной особи/организма.|
organismName|occ|Имя/метка особи.|
organismScope|occ|Тип совокупности: особь, популяция, колония.|
occurrenceRemarks|occ|Свободные примечания о находке.|on elytra and pronotum
eventID|evt|Идентификатор события сбора (экскурсии, ловушки). Объединяет несколько находок одного сбора.|
parentEventID|evt|Идентификатор более крупного события, частью которого является данный сбор.|
eventDate|evt|Дата (или интервал) сбора в формате ISO 8601: ГГГГ-ММ-ДД, ГГГГ-ММ, ГГГГ или интервал ГГГГ-ММ-ДД/ГГГГ-ММ-ДД.|2021-05-13
eventTime|evt|Время сбора (ISO 8601).|14:30+03:00
year|evt|Год сбора (число).|2021
month|evt|Месяц сбора (1–12).|5
day|evt|День месяца (1–31).|13
startDayOfYear|evt|Порядковый день года начала сбора.|133
endDayOfYear|evt|Порядковый день года окончания сбора.|
verbatimEventDate|evt|Дата в том виде, как написана на этикетке/в источнике.|13 May 2021
habitat|evt|Биотоп — тип местообитания, в котором найдена находка.|riverbank, damp soil
samplingProtocol|evt|Метод сбора: ручной сбор, почвенные ловушки, кошение сачком и т. п.|pitfall traps
samplingEffort|evt|Усилия сбора (число ловушек, часов, ловушко-суток).|10 traps, 14 days
sampleSizeValue|evt|Размер выборки (число).|
sampleSizeUnit|evt|Единица размера выборки.|
fieldNumber|evt|Полевой номер события (экскурсии).|
fieldNotes|evt|Ссылка на полевой дневник или его текст.|
eventRemarks|evt|Примечания о событии сбора.|
locationID|loc|Идентификатор места.|
higherGeographyID|loc|Идентификатор вышестоящей географической единицы.|
higherGeography|loc|Иерархия географических названий через « | ».|Europe | Ukraine | Kherson Oblast
continent|loc|Континент.|Europe
waterBody|loc|Водоём (море, озеро, река), если находка водная/прибрежная.|Black Sea
islandGroup|loc|Архипелаг.|
island|loc|Остров.|
country|loc|Страна (название).|Russia
countryCode|loc|Двухбуквенный код страны ISO 3166-1 alpha-2.|RU
stateProvince|loc|Область/край/республика (регион первого уровня).|Krasnodar Krai
county|loc|Район (второй административный уровень).|Kherson District
municipality|loc|Город, посёлок, село (третий уровень).|Zelenivka
locality|loc|Конкретное место находки: описание участка (урочище, парк, берег реки, расстояние от пункта).|Black Sea Biosphere Reserve, Potiivka section
verbatimLocality|loc|Место как написано на этикетке, без правок.|
minimumElevationInMeters|loc|Минимальная высота над уровнем моря, м.|1200
maximumElevationInMeters|loc|Максимальная высота над уровнем моря, м.|1650
verbatimElevation|loc|Высота как записана в источнике.|c. 1650 m
minimumDepthInMeters|loc|Минимальная глубина, м (для водных находок).|
maximumDepthInMeters|loc|Максимальная глубина, м.|
verbatimCoordinates|loc|Координаты как записаны в источнике.|46°42'29"N 32°36'34"E
verbatimLatitude|loc|Широта как записана в источнике.|46°42'29"N
verbatimLongitude|loc|Долгота как записана в источнике.|32°36'34"E
verbatimCoordinateSystem|loc|Система записи координат: десятичные градусы, градусы-минуты-секунды, UTM.|degrees minutes seconds
verbatimSRS|loc|Система отсчёта (датум) координат в источнике.|WGS84
decimalLatitude|loc|Широта в десятичных градусах (от −90 до 90), север — положительная. Используйте конвертер ниже.|46.708056
decimalLongitude|loc|Долгота в десятичных градусах (от −180 до 180), восток — положительная.|32.609444
geodeticDatum|loc|Геодезическая система координат (датум).|WGS84
coordinateUncertaintyInMeters|loc|Радиус неопределённости координат в метрах.|100
coordinatePrecision|loc|Точность десятичных координат (шаг округления).|0.0001
pointRadiusSpatialFit|loc|Насколько круг неопределённости соответствует месту.|
footprintWKT|loc|Контур участка в формате WKT.|
georeferencedBy|loc|Кто определил координаты.|
georeferencedDate|loc|Когда определены координаты.|
georeferenceProtocol|loc|Метод привязки координат (GPS, карта, геокодер).|GPS
georeferenceSources|loc|Источники для привязки (карты, GeoNames).|
georeferenceVerificationStatus|loc|Статус проверки координат.|verified by collector
georeferenceRemarks|loc|Примечания к привязке.|
locationRemarks|loc|Примечания о месте.|
identificationID|idn|Идентификатор определения.|
identifiedBy|idn|Кто определил организм (определитель). Несколько — через « | » или «;».|W. Rossi
identifiedByID|idn|Идентификатор определителя (ORCID и т. п.).|
dateIdentified|idn|Дата определения (ISO 8601).|2022-03-10
identificationQualifier|idn|Уточнение неуверенности: cf., aff., ? и т. п.|cf.
identificationVerificationStatus|idn|Проверено ли определение.|verified
identificationReferences|idn|Определители и литература, по которым определено.|Santamaria & Pedersen 2021
identificationRemarks|idn|Примечания к определению.|
typeStatus|idn|Типовой статус образца: holotype, isotype, paratype и др.|holotype
type|rec|Общий тип ресурса (обычно PhysicalObject, Event, HumanObservation).|PhysicalObject
modified|rec|Дата последнего изменения записи (ISO 8601).|2026-10-11
language|rec|Язык записи (код ISO 639-1).|ru
license|rec|Лицензия на данные.|CC BY 4.0
rightsHolder|rec|Правообладатель данных.|
accessRights|rec|Условия доступа к данным.|
bibliographicCitation|rec|Как цитировать эту запись.|
references|rec|Ссылка (URL) на страницу с описанием записи.|
institutionID|rec|Идентификатор организации-владельца.|
collectionID|rec|Идентификатор коллекции.|
datasetID|rec|Идентификатор набора данных.|
institutionCode|rec|Код/название организации-владельца.|KHER
collectionCode|rec|Код/название коллекции.|
datasetName|rec|Название набора данных.|Laboulbeniomycetes of the Black Sea region
ownerInstitutionCode|rec|Организация-владелец, если отличается от хранящей.|
informationWithheld|rec|Какая информация скрыта (напр., точные координаты редкого вида).|
dataGeneralizations|rec|Какие данные обобщены (округлены координаты и т. п.).|
dynamicProperties|rec|Дополнительные свойства в виде JSON или «ключ=значение».|
`;

// Допустимые значения для подсказок в ячейках (списки выбора)
window.DWC_VOCAB = {
  basisOfRecord: ['PreservedSpecimen','FossilSpecimen','LivingSpecimen','MaterialSample','MaterialCitation','HumanObservation','MachineObservation','Occurrence'],
  taxonRank: ['kingdom','phylum','class','order','family','subfamily','tribe','genus','subgenus','species','subspecies','variety','form','forma specialis','hybrid'],
  occurrenceStatus: ['present','absent'],
  sex: ['male','female','hermaphrodite','unknown'],
  lifeStage: ['adult','larva','nymph','pupa','egg','juvenile','immature'],
  establishmentMeans: ['native','introduced','naturalised','invasive','managed','uncertain'],
  geodeticDatum: ['WGS84','EPSG:4326','NAD83','ETRS89','Pulkovo 1942'],
  typeStatus: ['holotype','isotype','lectotype','neotype','paratype','syntype','epitype'],
  taxonomicStatus: ['accepted','synonym','homotypic synonym','heterotypic synonym','doubtful','misapplied'],
  nomenclaturalCode: ['ICN','ICZN','ICNP','ICNCP'],
  identificationVerificationStatus: ['verified','unverified','requires verification'],
  type: ['PhysicalObject','Event','HumanObservation','MachineObservation','StillImage'],
  continent: ['Europe','Asia','Africa','North America','South America','Oceania','Antarctica']
};

// Числовые термины (в Excel записываются как числа)
window.DWC_NUMERIC = ['decimalLatitude','decimalLongitude','minimumElevationInMeters','maximumElevationInMeters','minimumDepthInMeters','maximumDepthInMeters','coordinateUncertaintyInMeters','coordinatePrecision','individualCount','organismQuantity','year','month','day','startDayOfYear','endDayOfYear','namePublishedInYear'];

// Готовые наборы столбцов
window.DWC_PRESETS = {
  'Минимальный': ['occurrenceID','basisOfRecord','scientificName','eventDate','country','locality','decimalLatitude','decimalLongitude','recordedBy'],
  'Микология / паразиты насекомых (как в примере)': ['occurrenceID','basisOfRecord','scientificName','kingdom','phylum','class','order','genus','taxonRank','associatedTaxa','eventDate','dateIdentified','identifiedBy','recordedBy','country','stateProvince','locality','decimalLatitude','decimalLongitude','geodeticDatum','coordinateUncertaintyInMeters','habitat','minimumElevationInMeters','catalogNumber','associatedReferences','publicationYear','occurrenceRemarks']
};

// Готовые пользовательские поля (не входят в Darwin Core)
window.DWC_BUILTIN_CUSTOM = {
  publicationYear: 'Год публикации данных о находке (в Darwin Core нет отдельного термина; год также можно извлечь из associatedReferences).'
};
