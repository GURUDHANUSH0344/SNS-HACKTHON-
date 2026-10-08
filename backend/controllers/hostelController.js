const { Hostel, Student } = require('../models');

exports.getHostel = async (req, res) => {
  try {
    const { block, status } = req.query;
    const where = {};

    if (block && block !== 'all') {
      where.block = block;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const rooms = await Hostel.findAll({
      where,
      include: [{ model: Student, as: 'student' }],
      order: [['block', 'ASC'], ['roomNumber', 'ASC']]
    });

    const students = await Student.findAll({ order: [['name', 'ASC']] });

    // Stats
    const allRooms = await Hostel.findAll();
    const totalRooms = allRooms.length;
    const occupiedCount = allRooms.filter(r => r.status === 'Occupied').length;
    const vacantCount = allRooms.filter(r => r.status === 'Vacant').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

    res.render('hostel', {
      pageTitle: 'Hostel & Residential Management — CAMPUS AI',
      rooms,
      students,
      totalRooms,
      occupiedCount,
      vacantCount,
      occupancyRate,
      selectedBlock: block || 'all',
      selectedStatus: status || 'all',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/500', { pageTitle: 'Error', message: 'Failed to load hostel data.' });
  }
};

exports.allocateRoom = async (req, res) => {
  try {
    const { roomId, studentId, rentPerMonth, remarks } = req.body;
    const room = await Hostel.findByPk(roomId);

    if (!room) {
      return res.redirect('/hostel?error=Room+not+found');
    }

    room.studentId = parseInt(studentId);
    room.status = 'Occupied';
    room.checkInDate = new Date().toISOString().slice(0, 10);
    if (rentPerMonth) room.rentPerMonth = parseFloat(rentPerMonth);
    if (remarks) room.remarks = remarks;
    await room.save();

    res.redirect('/hostel?success=Room+allocated+successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/hostel?error=Failed+to+allocate+room');
  }
};

exports.vacateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Hostel.findByPk(id);

    if (!room) {
      return res.redirect('/hostel?error=Room+not+found');
    }

    room.studentId = null;
    room.status = 'Vacant';
    room.checkOutDate = new Date().toISOString().slice(0, 10);
    await room.save();

    res.redirect('/hostel?success=Room+vacated+and+marked+available');
  } catch (err) {
    console.error(err);
    res.redirect('/hostel?error=Failed+to+vacate+room');
  }
};

exports.addRoom = async (req, res) => {
  try {
    const { block, roomNumber, bedNumber, roomType, rentPerMonth } = req.body;

    await Hostel.create({
      block,
      roomNumber,
      bedNumber,
      roomType: roomType || 'Non-AC 2-Sharing',
      rentPerMonth: parseFloat(rentPerMonth) || 6500,
      status: 'Vacant'
    });

    res.redirect('/hostel?success=New+room+added+to+inventory');
  } catch (err) {
    console.error(err);
    res.redirect('/hostel?error=Failed+to+add+room');
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await Hostel.destroy({ where: { id } });
    res.redirect('/hostel?success=Room+record+deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/hostel?error=Failed+to+delete+room');
  }
};
