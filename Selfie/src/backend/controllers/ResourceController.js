import Resource from '../models/ResourceModel.js';
import Event from '../models/EventModel.js';

const createResource = async (req, res) => {
  try {
    const { name, type } = req.body;
    const resource = new Resource({ name, type });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: 'Errore creazione risorsa' });
  }
};

const getResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: 'Errore recupero risorse' });
  }
};

const getResourceCalendar = async (req, res) => {
  try {
    const events = await Event.find({ resource: req.params.id });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Errore recupero calendario risorsa' });
  }
};

export { createResource, getResources, getResourceCalendar }; 