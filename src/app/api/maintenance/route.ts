import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getMaintenanceCollection } from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get maintenance status
export async function GET() {
  try {
    const maintenanceCollection = await getMaintenanceCollection();
    const status = await maintenanceCollection.findOne({ key: 'maintenance' } as any);
    
    return NextResponse.json({
      isEnabled: status?.isEnabled || false,
      message: status?.message || 'System maintenance is in progress. Please check back soon.'
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json(
      { isEnabled: false },
      { status: 500 }
    );
  }
}

// Toggle maintenance mode (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and check role
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string; userId: string };

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can manage maintenance mode' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isEnabled, message } = body;

    const maintenanceCollection = await getMaintenanceCollection();

    // Update or create maintenance status
    const result = await maintenanceCollection.findOneAndUpdate(
      { key: 'maintenance' } as any,
      {
        $set: {
          isEnabled: isEnabled ?? false,
          message: message || 'System maintenance is in progress. Please check back soon.',
          updatedAt: new Date(),
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      isEnabled: result?.value?.isEnabled ?? false,
      message: result?.value?.message || 'System maintenance is in progress. Please check back soon.'
    });
  } catch (error) {
    console.error('Maintenance error:', error);
    return NextResponse.json(
      { error: 'Failed to update maintenance status' },
      { status: 500 }
    );
  }
}
